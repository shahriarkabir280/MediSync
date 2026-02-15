import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Send, Paperclip, Smile, MoreVertical, MoreHorizontal, MapPin, RotateCcw,
  Phone, Video, ArrowLeft, ArrowRight, Check, CheckCheck, X, Reply, Trash2, Pin, BellOff, Archive,
  Mic, Image, File, StopCircle, Download, Share2, Save, FileText, FileImage, FileVideo, FileAudio,
  ExternalLink, Eye, MessageCircle, Forward, Settings, Info, Lock, Bell, Volume2, Monitor, Moon, Sun,
  Type, Zap, Shield, Users, Copy, Clock, Keyboard, Palette, Circle
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

  // Handle socket reconnection to re-join active room
  useEffect(() => {
    if (socket.socket && socket.isConnected && selectedChat?.id) {
      console.log('🔄 Reconnected - re-joining chat room:', selectedChat.id);
      socket.joinChat(selectedChat.id);
    }
  }, [socket.isConnected, socket.socket, selectedChat?.id]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket.socket) return;

    // New message received
    socket.on('new_message', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        // Don't add the message if it's from the current user (already added optimistically)
        const isMyMessage = data.message.sender_id === currentUser.userId &&
          data.message.sender_type === currentUser.userType;

        if (!isMyMessage) {
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();

          // Mark as read
          socket.markAsRead(data.chatId, [data.message.id], currentUser.userId, currentUser.userType);
        }
      }

      // Update chat list optimistically
      updateChatListWithMessage(data.chatId, data.message);
      setIsSearchFocused(false);
      setSearchQuery('');
      setSearchResults([]);
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

  // Update chat list optimistically with new message
  const updateChatListWithMessage = (chatId, message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            last_message: {
              id: message.id,
              content: message.content,
              message_type: message.message_type,
              sender_id: message.sender_id,
              sender_name: message.sender_name,
              created_at: message.created_at,
              is_deleted: false
            },
            last_message_at: message.created_at,
            updated_at: message.created_at
          };
        }
        return chat;
      });

      // Sort by most recent
      return updatedChats.sort((a, b) => {
        const timeA = new Date(a.last_message_at || a.created_at).getTime();
        const timeB = new Date(b.last_message_at || b.created_at).getTime();
        return timeB - timeA;
      });
    });
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

      // Update chat list optimistically
      updateChatListWithMessage(selectedChat.id, newMessage);

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

      // Update chat list optimistically
      updateChatListWithMessage(selectedChat.id, newMessage);

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
      // Check for 25MB limit
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_SIZE) {
        showToast('File size exceeds 25MB limit', 'error');
        e.target.value = ''; // Clear selection
        return;
      }
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

      // Exit search mode completely
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchFocused(false);

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
    <div className="h-[calc(100vh-110px)] lg:h-[calc(100vh-140px)] w-full min-w-0 flex bg-card rounded-2xl overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in duration-500">
      {/* Left Sidebar - Chat List */}
      <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-[320px] flex-shrink-0 flex-col bg-card/50 backdrop-blur-md border-r border-border`}>
        {/* Modern Glassmorphism Header */}
        <div className="p-4 bg-card/80 backdrop-blur-xl sticky top-0 z-20 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent font-outfit">
                Messages
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsSearchFocused(true);
                  searchInputRef.current?.focus();
                  handleSearch('');
                }}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all border border-indigo-200 shadow-sm group"
                title="New Message"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200 shadow-sm group"
                title="Settings"
              >
                <Settings size={16} className="group-hover:rotate-45 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Floating Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onFocus={() => {
                setIsSearchFocused(true);
                handleSearch(searchQuery);
              }}
              onBlur={() => {
                // Delay blur to allow clicking on results
                setTimeout(() => setIsSearchFocused(false), 200);
              }}
              className="block w-full pl-9 pr-8 py-2 bg-muted/50 border border-border rounded-xl text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-card text-foreground transition-all shadow-sm"
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
                <X size={14} />
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
                    className="group p-2.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${user.user_type === 'doctor'
                        ? 'from-indigo-100 to-indigo-200 text-indigo-700'
                        : 'from-emerald-100 to-emerald-200 text-emerald-700'
                        } rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                        {user.user_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-foreground truncate text-[13px]">{user.user_name}</h4>
                        <div className="flex items-center">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${user.user_type === 'doctor' ? 'bg-indigo-400' : 'bg-emerald-400'
                            }`}></span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                            {user.user_type === 'doctor' ? 'Provider' : 'Patient'}
                            {user.specialization && ` • ${user.specialization}`}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                        <Plus className="w-4 h-4 text-indigo-500" />
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
        <div className="flex-1 min-w-0 flex flex-col bg-background relative z-30 animate-in slide-in-from-right-4 duration-300">
          {/* Chat Header */}
          {/* Modern Chat Header */}
          <div className="h-16 bg-card/80 backdrop-blur-xl border-b border-border pl-4 pr-1.5 md:pl-6 md:pr-4 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center space-x-1.5 md:space-x-3 flex-1 min-w-0 mr-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
                title="Back to Chats"
              >
                <ArrowLeft size={18} className="text-foreground" />
              </button>

              <div className="relative group">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-lg shadow-indigo-100 transform group-hover:scale-105 transition-all duration-300">
                  {selectedChat.other_user?.user_name?.charAt(0) || '?'}
                </div>
                {socket.isUserOnline(selectedChat.other_user?.user_id, selectedChat.other_user?.user_type) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-[3px] border-card"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-black text-foreground text-sm md:text-base font-outfit leading-tight">
                  {selectedChat.other_user?.user_name || 'System User'}
                </h3>
                <p className="text-[10px] md:text-xs flex items-center space-x-1.5 truncate">
                  {(() => {
                    const activityStatus = socket.getUserActivityStatus(
                      selectedChat.other_user?.user_id,
                      selectedChat.other_user?.user_type
                    );

                    if (activityStatus === 'active') {
                      return (
                        <>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-emerald-600 font-bold uppercase tracking-wider opacity-80">Online</span>
                        </>
                      );
                    } else if (activityStatus === 'away') {
                      return (
                        <>
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          <span className="text-amber-600 font-bold uppercase tracking-wider opacity-80">Away</span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                          <span className="text-slate-500 font-bold uppercase tracking-wider opacity-80">Offline</span>
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
                className="p-2 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-100"
                title="Voice Call"
              >
                <Phone size={16} />
              </button>
              <button
                onClick={() => {
                  setCallType('video');
                  setIsIncomingCall(false);
                  setShowVideoCall(true);
                }}
                className="p-2 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all duration-300 border border-transparent hover:border-indigo-100"
                title="Video Call"
              >
                <Video size={16} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowChatInfo(!showChatInfo)}
                  className="p-2 hover:bg-muted text-muted-foreground rounded-xl transition-all duration-300 border border-transparent hover:border-border"
                  title="Chat Info"
                >
                  <Info size={16} />
                </button>

                {showChatInfo && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowChatInfo(false)}
                    />
                    <div className="absolute right-0 top-14 w-72 bg-card rounded-3xl shadow-2xl border border-border py-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                      <div className="px-5 py-2 mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-loose">Conversation Controls</p>
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
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg transition-colors ${perChatSettings.isMuted ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                              <BellOff size={18} />
                            </div>
                            <span className={perChatSettings.isMuted ? 'text-indigo-500' : 'text-foreground'}>Mute Notifications</span>
                          </div>
                          {perChatSettings.isMuted && <Check size={16} className="text-indigo-500" />}
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
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 rounded-2xl flex items-center justify-between text-sm font-bold transition-colors group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg transition-colors ${perChatSettings.isPinned ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground group-hover:bg-indigo-500/10 group-hover:text-indigo-500'}`}>
                              <Pin size={18} />
                            </div>
                            <span className={perChatSettings.isPinned ? 'text-indigo-500' : 'text-foreground'}>Pin to Top</span>
                          </div>
                          {perChatSettings.isPinned && <Check size={16} className="text-indigo-500" />}
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 bg-muted/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                <div className="relative group">
                  {/* Decorative Glow */}
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-700 animate-pulse"></div>

                  {/* Outer Pulsing Container */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 transform animate-in zoom-in-50 duration-500">
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-white/20 animate-ping opacity-20"></div>
                    <div className="absolute inset-2 rounded-[1.6rem] border-2 border-white/10 animate-pulse"></div>

                    {/* Brand Icon */}
                    <MessageCircle size={36} className="text-white animate-bounce [animation-duration:2s]" />
                  </div>
                </div>

                {/* Refined Text */}
                <div className="flex flex-col items-center space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 animate-pulse">
                    Synchronizing
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Preparing your secure workspace
                  </p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center px-6">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-6 transform hover:rotate-6 transition-transform duration-500">
                  <MessageCircle size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No messages yet</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Send your first message to start the consultation with <span className="text-indigo-500 font-bold">{selectedChat.other_user?.user_name}</span>.
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender_id === currentUser.userId && message.sender_type === currentUser.userType;
                const prevMessage = messages[index - 1];
                const nextMessage = messages[index + 1];

                const isFirst = !prevMessage || prevMessage.sender_id !== message.sender_id;
                const isLast = !nextMessage || nextMessage.sender_id !== message.sender_id;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    isFirst={isFirst}
                    isLast={isLast}
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
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-3 px-6 py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex space-x-1 bg-card px-3 py-2 rounded-2xl shadow-sm border border-border">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Someone is typing</span>
              </div>
            )}

            {/* Scroll Target */}
            <div ref={messagesEndRef} className="h-4" />
          </div>
          {/* Reply Preview */}
          {replyTo && (
            <div className="px-6 py-4 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-between animate-in slide-in-from-bottom-full duration-300">
              <div className="flex-1 pl-4 border-l-4 border-indigo-500 rounded-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">
                  Replying to <span className="font-outfit">{replyTo.sender_name}</span>
                </p>
                <p className="text-sm text-foreground/80 font-medium truncate italic px-1">"{replyTo.content}"</p>
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
          <div className="bg-card border-t border-border px-4 md:px-6 py-4">
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
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-rose-600 transition-all shadow-sm"
                  title="Cancel Recording"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={stopRecording}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
                  title="Send Recording"
                >
                  <Send size={16} />
                </button>
              </div>
            ) : (
              // Normal input UI
              <div className="flex items-center space-x-2">
                {/* Attachment Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`p-2 rounded-xl transition-all duration-300 border ${showAttachMenu ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-muted/50 border-transparent text-slate-500 hover:bg-muted hover:text-slate-700'}`}
                    disabled={uploadingFile}
                  >
                    <Paperclip size={18} className={showAttachMenu ? 'rotate-45 transition-transform' : ''} />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-4 left-0 w-64 bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-border p-3 space-y-1.5 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 z-50">
                      <div className="px-5 py-2 mb-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-outfit">Share content</p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-4 px-5 py-3.5 hover:bg-slate-50 rounded-3xl text-left transition-all duration-300 group"
                      >
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-lg shadow-indigo-100 group-hover:scale-110 group-hover:rotate-6 transition-all">
                          <Image size={18} className="text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800">Media</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Photos & GIFs</p>
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
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shadow-emerald-100 group-hover:scale-110 group-hover:-rotate-6 transition-all">
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
                    <div className="absolute bottom-full mb-2 left-0 bg-card rounded-2xl shadow-2xl border border-border p-3 w-80 max-h-96 overflow-y-auto z-50">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h4 className="font-outfit font-black text-foreground text-sm flex-1">Emoji Library</h4>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="p-1 hover:bg-muted rounded-full"
                        >
                          <X size={16} className="text-muted-foreground" />
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
                              className="text-2xl hover:bg-muted rounded p-1 transition-all hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                      </div>

                      {/* GIF Note */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          💡 Tip: You can also paste GIF links directly in your message
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 relative group">
                  <textarea
                    ref={messageInputRef}
                    rows="1"
                    placeholder={uploadingFile ? "Uploading..." : "Type a message..."}
                    value={messageInput}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 2500);
                      setMessageInput(val);
                      handleTyping();

                      // Auto-grow height
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !uploadingFile) {
                        e.preventDefault();
                        handleSendMessage();
                        e.target.style.height = 'auto';
                      }
                    }}
                    disabled={uploadingFile}
                    className="w-full bg-muted/30 hover:bg-muted/40 border border-border/50 focus:border-indigo-500/30 focus:bg-card px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50 text-foreground resize-none scrollbar-none min-h-[46px] max-h-[160px] shadow-sm"
                  />
                  {messageInput.length >= 2400 && (
                    <div className={`absolute -top-6 right-2 text-[9px] font-black uppercase tracking-widest ${messageInput.length >= 2500 ? 'text-rose-500 animate-pulse' : 'text-muted-foreground/50'
                      }`}>
                      {messageInput.length}/2500
                    </div>
                  )}
                </div>

                {messageInput.trim() || uploadingFile ? (
                  <button
                    onClick={() => {
                      handleSendMessage();
                      if (messageInputRef.current) messageInputRef.current.style.height = 'auto';
                    }}
                    disabled={!messageInput.trim() || messageInput.length > 2500 || uploadingFile}
                    className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-2.5 bg-muted/50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all transform hover:scale-105 active:scale-95 border border-transparent hover:border-indigo-100"
                    title="Voice Message"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="text-center max-w-sm px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8 transform hover:scale-105 hover:rotate-3 transition-all duration-500 group">
              <MessageCircle size={40} className="text-white group-hover:scale-110 transition-transform" />
            </div>
            <h2 className="text-xl font-black text-foreground mb-3 font-outfit uppercase tracking-tight">Select a conversation</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed opacity-70">
              Choose one of your patient chats from the list to start messaging and manage their care plan.
            </p>
          </div>
        </div>
      )}

      {/* Delete Message Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
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
            <div className="p-8 space-y-4 bg-card">
              <p className="text-muted-foreground font-medium text-center px-4">
                Choose how you would like to proceed with deleting this message.
              </p>

              <div className="space-y-3">
                {/* Delete for Me Option */}
                <button
                  onClick={() => confirmDelete(false)}
                  className="w-full p-5 bg-muted/50 hover:bg-muted border-2 border-transparent hover:border-border rounded-3xl transition-all duration-300 group flex items-start space-x-4"
                >
                  <div className="p-3 bg-card rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <Trash2 size={20} className="text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-bold text-foreground text-sm">Delete for Me</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">This message will be hidden from your view only.</p>
                  </div>
                </button>

                {/* Delete for Everyone Option */}
                {canDeleteForEveryone ? (
                  <button
                    onClick={() => confirmDelete(true)}
                    className="w-full p-5 bg-rose-50 hover:bg-rose-100 border-2 border-transparent hover:border-rose-200 rounded-3xl transition-all duration-300 group flex items-start space-x-4"
                  >
                    <div className="p-3 bg-card rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Trash2 size={20} className="text-rose-500" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-rose-600 text-sm">Delete for Everyone</h4>
                      <p className="text-[11px] text-rose-400 font-medium mt-1">Permanently remove this message from all participants.</p>
                    </div>
                  </button>
                ) : (
                  <div className="w-full p-5 bg-muted/30 opacity-60 rounded-3xl flex items-start space-x-4 border border-dashed border-border text-muted-foreground">
                    <div className="p-3 bg-card rounded-2xl">
                      <Trash2 size={20} className="text-muted-foreground/50" />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-bold text-muted-foreground text-sm italic">Delete for Everyone</h4>
                      <p className="text-[11px] text-muted-foreground font-medium mt-1">Only available within 1 hour of sending.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-muted/20 flex space-x-3 border-t border-border">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3.5 bg-card text-muted-foreground font-bold text-sm rounded-2xl hover:bg-muted border border-border transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
            <div className="p-8">
              <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Trash2 size={36} className="text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-foreground text-center font-outfit mb-2">Clear all messages?</h3>
              <p className="text-muted-foreground font-medium text-center text-sm leading-relaxed px-2">
                This will permanently delete the entire conversation history. This action <span className="text-rose-500 font-bold underline underline-offset-4 decoration-2">cannot be undone</span>.
              </p>
            </div>

            <div className="px-8 pb-8 flex flex-col space-y-3">
              <button
                onClick={confirmClearChat}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/10 transition-all transform active:scale-95 text-sm"
              >
                Yes, Clear Chat
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-4 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-2xl transition-all active:scale-95 text-sm"
              >
                No, Keep My Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Message Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
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
            <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-muted/20">
              {chats.filter(chat => chat.id !== selectedChat?.id).map(chat => (
                <button
                  key={chat.id}
                  onClick={() => toggleChatForForward(chat.id)}
                  className={`w-full p-2.5 rounded-2xl border-2 transition-all duration-300 flex items-center space-x-3 group ${selectedChatsForForward.includes(chat.id)
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-md'
                    : 'border-transparent bg-card hover:bg-muted/50 hover:shadow-lg hover:shadow-indigo-500/5'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${selectedChatsForForward.includes(chat.id)
                    ? 'border-indigo-600 bg-indigo-600 scale-110'
                    : 'border-border bg-card group-hover:border-indigo-500/30'
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
                    <p className="font-bold text-foreground">{chat.other_user?.user_name || 'System User'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                      {chat.other_user?.user_type}
                    </p>
                  </div>
                </button>
              ))}

              {chats.filter(chat => chat.id !== selectedChat?.id).length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-muted rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-muted-foreground font-bold text-sm">No other active chats found</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-card border-t border-border flex items-center justify-between space-x-4">
              <button
                onClick={() => setShowForwardModal(false)}
                className="flex-1 px-6 py-3.5 text-muted-foreground font-bold text-sm hover:bg-muted rounded-2xl transition-all"
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[2.5rem] shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-border">
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
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background/30">
              {/* Notifications Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Bell size={18} className="text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Notifications</h3>
                </div>
                <div className="bg-card rounded-3xl p-4 shadow-sm border border-border space-y-1">
                  {[
                    { key: 'sound', label: 'Sound', desc: 'Play sound for new messages', icon: Volume2 },
                    { key: 'desktop', label: 'Desktop Notifications', desc: 'Show notifications on desktop', icon: Monitor },
                    { key: 'messagePreview', label: 'Message Preview', desc: 'Show message content in notifications', icon: Eye }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-2.5 hover:bg-muted rounded-xl cursor-pointer transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                          <item.icon size={20} className="text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
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
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Privacy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Shield size={18} className="text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Privacy & Security</h3>
                </div>
                <div className="bg-card rounded-3xl p-4 shadow-sm border border-border space-y-1">
                  {[
                    { key: 'readReceipts', label: 'Read Receipts', desc: 'Let others know when you\'ve read messages', icon: CheckCheck },
                    { key: 'onlineStatus', label: 'Online Status', desc: 'Show when you\'re online', icon: Circle },
                    { key: 'typingIndicator', label: 'Typing Indicator', desc: 'Show when you\'re typing', icon: Type },
                    { key: 'lastSeen', label: 'Last Seen', desc: 'Show your last activity time', icon: Clock }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-4 hover:bg-muted rounded-2xl cursor-pointer transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                          <item.icon size={20} className="text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{item.label}</p>
                          <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
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
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chat Preferences */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2 px-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <MessageCircle size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Chat Preferences</h3>
                </div>
                <div className="bg-card rounded-3xl p-4 shadow-sm border border-border space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                        <Keyboard size={20} className="text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Enter to Send</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Shift + Enter for new line</p>
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
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </div>
                  </label>

                  <div className="flex flex-col space-y-4 border-t border-border pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                          <Type size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">Font Size</p>
                      </div>
                      <div className="flex bg-muted p-1 rounded-xl border border-border">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setChatSettings({ ...chatSettings, chat: { ...chatSettings.chat, fontSize: size } })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chatSettings.chat.fontSize === size
                              ? 'bg-card text-indigo-500 shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                          <Palette size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-bold text-foreground">Theme</p>
                      </div>
                      <div className="flex bg-muted p-1 rounded-xl border border-border">
                        {['light', 'dark', 'auto'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setChatSettings({ ...chatSettings, chat: { ...chatSettings.chat, theme: t } })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chatSettings.chat.theme === t
                              ? 'bg-card text-indigo-500 shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
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
            <div className="px-8 py-6 bg-card border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-3 text-sm text-muted-foreground font-bold hover:bg-muted rounded-2xl transition-all"
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
    try {
      // If the date string doesn't include a timezone, assume UTC
      let utcDate = date;
      if (typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
        utcDate = date.replace(' ', 'T') + 'Z';
      }

      const d = new Date(utcDate);
      const finalDate = isNaN(d.getTime()) ? new Date(date) : d;
      const now = new Date();
      const diff = now - finalDate;

      if (diff < 86400000) { // Less than 24 hours
        return finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      } else if (diff < 604800000) { // Less than 7 days
        return finalDate.toLocaleDateString([], { weekday: 'short' });
      } else {
        return finalDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };

  const isArchived = chat.is_archived || false;
  const isMuted = chat.is_muted || false;
  const isPinned = chat.is_pinned || false;

  return (
    <div
      onClick={onClick}
      className={`relative group h-16 p-3 rounded-2xl border transition-all duration-500 cursor-pointer mb-2 overflow-hidden
        ${isSelected
          ? 'bg-card border-border shadow-2xl shadow-indigo-500/10 scale-[1.01] z-10 translate-x-1'
          : 'bg-transparent border-transparent hover:bg-card hover:border-border hover:shadow-xl hover:shadow-slate-500/5 hover:translate-x-1'
        } ${isArchived ? 'opacity-60' : ''}`}
    >
      {isSelected && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-xl"></div>
      )}
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm transition-transform group-hover:scale-105 duration-300
            ${isSelected
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
              : 'bg-indigo-50 text-indigo-600'
            }`}>
            {chat.other_user?.user_name?.charAt(0) || '?'}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className={`font-black truncate text-xs tracking-tight ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
              {chat.other_user?.user_name || 'System User'}
            </h4>
            <span className={`text-[8px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-400' : 'text-muted-foreground'}`}>
              {formatTime(chat.last_message_at || chat.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-[10px] truncate font-bold flex-1 ${isSelected ? 'text-indigo-500' : 'text-muted-foreground'}`}>
              {chat.last_message?.is_deleted
                ? 'Message was deleted'
                : chat.last_message?.content || 'Click to start chatting'}
            </p>
            <div className="flex items-center ml-2">
              {chat.unread_count > 0 && (
                <span className={`min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black rounded-full shadow-lg
                  ${isMuted ? 'bg-slate-300 text-white' : 'bg-indigo-600 text-white animate-pulse'}`}>
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
const MessageBubble = ({ message, isOwn, isFirst, isLast, onReply, onDelete, onForward, onCopy, onReact, onCallBack }) => {
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);

  // Close actions menu when clicking anywhere else
  React.useEffect(() => {
    if (!showActionsMenu) return;
    const handleClick = () => setShowActionsMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showActionsMenu]);

  const formatTime = (date) => {
    if (!date) return '';
    try {
      // If the date string doesn't include a timezone, assume UTC
      let utcDate = date;
      if (typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
        // Handle 'YYYY-MM-DD HH:MM:SS' or similar formats by converting to ISO and adding Z
        utcDate = date.replace(' ', 'T') + 'Z';
      }

      const d = new Date(utcDate);
      // Fallback if the above conversion failed
      const finalDate = isNaN(d.getTime()) ? new Date(date) : d;

      return finalDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  // Message status indicator (for sender's messages)
  const MessageStatus = ({ message }) => {
    const status = message.my_status?.status;
    if (!status) return null;

    // Read: Blue double check (WhatsApp style)
    if (status === 'read') return <CheckCheck size={12} className="text-blue-400" />;
    // Delivered: Gray double check
    if (status === 'delivered') return <CheckCheck size={12} className="text-white/60" />;
    // Sent: Single gray check
    if (status === 'sent') return <Check size={12} className="text-white/60" />;
    return null;
  };

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
        <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-muted/30 border border-border/50 text-muted-foreground italic text-[11px]">
          Message deleted
        </div>
      </div>
    );
  }

  // Border Radius Logic for modern grouping
  const getCorners = () => {
    if (isOwn) {
      return `rounded-[20px] ${isFirst ? 'rounded-tr-lg' : 'rounded-tr-[4px]'} ${isLast ? 'rounded-br-lg' : 'rounded-br-[4px]'}`;
    }
    return `rounded-[20px] ${isFirst ? 'rounded-tl-lg' : 'rounded-tl-[4px]'} ${isLast ? 'rounded-bl-lg' : 'rounded-bl-[4px]'}`;
  };

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isLast ? 'mb-4' : 'mb-0.5'} px-2 md:px-4 group relative`}>
      <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[85%] md:max-w-[75%] gap-1 transition-all duration-300`}>

        <div className="flex flex-col relative group/bubble">
          {/* Reaction Bar (Hover) */}
          <div className={`absolute -top-7 ${isOwn ? 'right-0' : 'left-0'} opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/bubble:translate-y-0 flex items-center bg-card shadow-xl border border-border/50 rounded-full px-2 py-0.5 z-20 gap-1`}>
            {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(message.id, emoji);
                }}
                className="hover:scale-125 transition-transform px-0.5 text-base"
              >
                {emoji}
              </button>
            ))}
          </div>

          {message.reply_to && (
            <div className={`mb-px px-3 py-1.5 bg-muted/30 rounded-t-2xl text-[10px] mx-1 opacity-80`}>
              <p className="font-bold text-indigo-600 truncate">{message.reply_to.sender_name}</p>
              <p className="text-muted-foreground truncate italic">{message.reply_to.content}</p>
            </div>
          )}

          <div
            className={`relative p-2.5 transition-all duration-300 shadow-sm ${getCorners()} ${isOwn
              ? 'bg-indigo-600 text-white'
              : 'bg-[#E4E6EB] dark:bg-muted/60 text-foreground'
              } ${message.reply_to ? 'rounded-t-none' : ''}`}
          >
            {/* Media Content */}
            {message.media_url && (
              <div className="mb-1.5 -mx-0.5 -mt-0.5 overflow-hidden rounded-[14px]">
                {message.media_type?.startsWith('image/') ? (
                  <img
                    src={`http://localhost:3001${message.media_url}`}
                    alt="Media"
                    className="max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
                  />
                ) : message.media_type?.startsWith('video/') ? (
                  <video controls className="max-w-full">
                    <source src={`http://localhost:3001${message.media_url}`} type={message.media_type} />
                  </video>
                ) : (
                  <div className={`flex items-center gap-2.5 p-2.5 ${isOwn ? 'bg-white/10' : 'bg-black/5'}`}>
                    <div className={`p-2 rounded-xl ${isOwn ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-600'}`}>
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-[11px] font-bold truncate ${isOwn ? 'text-white' : 'text-foreground'}`}>{message.media_name}</p>
                      <p className={`text-[9px] opacity-70 font-bold ${isOwn ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                        {(message.media_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a href={`http://localhost:3001${message.media_url}`} download className={`p-1.5 rounded-lg transition-colors ${isOwn ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                      <Download size={14} className={isOwn ? 'text-white' : 'text-muted-foreground'} />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Message Content */}
            {message.content && message.content !== message.media_name && (
              <p className="text-xs md:text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                {message.content}
              </p>
            )}

            {/* Reactions Display */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={`absolute -bottom-2 ${isOwn ? 'left-0' : 'right-0'} flex -space-x-1`}>
                {message.reactions.map((r, idx) => (
                  <div key={idx} className="bg-card shadow-sm border border-border/50 rounded-full px-1 py-0.5 text-[10px] transform hover:scale-110 transition-transform">
                    {r.emoji}
                  </div>
                ))}
              </div>
            )}

            {/* Inline Meta (Time & Status) */}
            <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-70 text-[9px] font-bold ${isOwn ? 'text-indigo-50' : 'text-muted-foreground'}`}>
              <span>{formatTime(message.created_at)}</span>
              {isOwn && <MessageStatus message={message} />}
            </div>
          </div>

          {/* Quick Actions Menu (Messenger Style) */}
          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 flex items-center ${isOwn ? '-left-10 pr-2' : '-right-10 pl-2'}`}>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsMenu(!showActionsMenu);
                }}
                className={`p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-all duration-300 ${showActionsMenu ? 'bg-muted rotate-90' : ''}`}
                title="More"
              >
                <MoreHorizontal size={16} />
              </button>

              {showActionsMenu && (
                <div className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} w-32 bg-card border border-border/50 shadow-2xl rounded-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReply(message); setShowActionsMenu(false); }}
                    className="w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-muted flex items-center gap-2.5 transition-colors"
                  >
                    <RotateCcw size={14} className="text-indigo-500" /> Reply
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onForward(message); setShowActionsMenu(false); }}
                    className="w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-muted flex items-center gap-2.5 transition-colors"
                  >
                    <Forward size={14} className="text-emerald-500" /> Forward
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(message.content); setShowActionsMenu(false); }}
                    className="w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-muted flex items-center gap-2.5 transition-colors"
                  >
                    <Copy size={14} className="text-amber-500" /> Copy
                  </button>
                  {isOwn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(message.id); setShowActionsMenu(false); }}
                      className="w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-muted text-rose-500 flex items-center gap-2.5 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;

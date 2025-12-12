import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Send, Paperclip, Smile, MoreVertical,
  Phone, Video, ArrowLeft, Check, CheckCheck, X, Reply, Trash2, PinIcon, BellOff, Archive,
  Mic, Image, File, StopCircle, Download, Share2, Save, FileText, FileImage, FileVideo, FileAudio,
  ExternalLink, Eye
} from 'lucide-react';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../contexts/AuthContext';

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

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  // WebSocket
  const socket = useChatSocket(currentUser);

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

    return () => {
      socket.off('new_message');
      socket.off('message_delivered');
      socket.off('messages_read');
      socket.off('user_typing');
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
                  className="p-4 border-b cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {user.user_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{user.user_name}</h4>
                      <p className="text-sm text-gray-500 truncate">
                        {user.user_type === 'doctor' ? 'Doctor' : 'Patient'}
                        {user.specialization && ` • ${user.specialization}`}
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {selectedChat.other_user?.user_name?.charAt(0) || '?'}
                </div>
                {socket.isUserOnline(selectedChat.other_user?.user_id, selectedChat.other_user?.user_type) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedChat.other_user?.user_name}
                </h3>
                <p className="text-xs text-gray-500">
                  {socket.isUserOnline(selectedChat.other_user?.user_id, selectedChat.other_user?.user_type)
                    ? 'Online'
                    : 'Offline'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Phone size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Video size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
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
                  onDelete={() => handleDeleteMessage(message.id)}
                />
              ))
            )}
            
            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyTo && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">Replying to {replyTo.sender_name}</p>
                <p className="text-sm text-gray-600 truncate">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 hover:bg-blue-100 rounded-full"
              >
                <X size={16} className="text-blue-600" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <div className="bg-white border-t px-4 py-3">
            {isRecording ? (
              // Recording UI
              <div className="flex items-center space-x-3 py-2">
                <div className="flex-1 flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
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
                    className="p-2 hover:bg-gray-100 rounded-full"
                    disabled={uploadingFile}
                  >
                    <Paperclip size={20} className="text-gray-600" />
                  </button>
                  
                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border p-2 space-y-1 min-w-[150px]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
                      >
                        <Image size={18} className="text-purple-600" />
                        <span className="text-sm">Image</span>
                      </button>
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
                          input.onchange = (e) => handleFileSelect(e, 'document');
                          input.click();
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 rounded-lg text-left"
                      >
                        <File size={18} className="text-blue-600" />
                        <span className="text-sm">Document</span>
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
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send size={20} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
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
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <Search size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a chat to start messaging</h3>
            <p className="text-sm">Choose a conversation from the list or start a new one</p>
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

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b cursor-pointer transition ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {chat.other_user?.user_name?.charAt(0) || '?'}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {chat.other_user?.user_name}
            </h4>
            <span className="text-xs text-gray-500">
              {formatTime(chat.last_message_at || chat.created_at)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 truncate">
              {chat.last_message?.is_deleted
                ? 'Message deleted'
                : chat.last_message?.content || 'No messages yet'}
            </p>
            {chat.unread_count > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
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
const MessageBubble = ({ message, isOwn, showAvatar, onReply, onDelete }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
      <div className={`max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
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
              <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity flex space-x-1">
                <button
                  onClick={() => window.open(`http://localhost:3001${message.media_url}`, '_blank')}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                  title="View Full Size"
                >
                  <Eye size={16} />
                </button>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name}
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
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
                <div className={`p-2 rounded-full ${isOwn ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <Mic size={18} className={isOwn ? 'text-white' : 'text-gray-600'} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
                    Voice Message
                  </p>
                </div>
                <a
                  href={`http://localhost:3001${message.media_url}`}
                  download={message.media_name || 'voice.webm'}
                  className={`p-1.5 rounded-full hover:bg-opacity-80 transition ${isOwn ? 'hover:bg-blue-500' : 'hover:bg-gray-200'}`}
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
                className="max-w-sm rounded-t-lg"
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
                  className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
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
              <div className={`border rounded-lg p-3 ${isOwn ? 'border-blue-500 bg-blue-500' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start space-x-3">
                  {/* File Icon based on type */}
                  <div className={`p-3 rounded-lg flex-shrink-0 ${isOwn ? 'bg-blue-400' : 'bg-gray-200'}`}>
                    {message.media_name?.match(/\.(pdf)$/i) ? (
                      <FileText size={24} className={isOwn ? 'text-white' : 'text-red-600'} />
                    ) : message.media_name?.match(/\.(doc|docx)$/i) ? (
                      <FileText size={24} className={isOwn ? 'text-white' : 'text-blue-600'} />
                    ) : message.media_name?.match(/\.(zip|rar)$/i) ? (
                      <File size={24} className={isOwn ? 'text-white' : 'text-yellow-600'} />
                    ) : (
                      <File size={24} className={isOwn ? 'text-white' : 'text-gray-600'} />
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
                        className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition ${
                          isOwn 
                            ? 'bg-white text-blue-600 hover:bg-blue-50' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </a>
                      <a
                        href={`http://localhost:3001${message.media_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded-lg transition ${
                          isOwn 
                            ? 'bg-blue-500 text-white hover:bg-blue-400' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

          {/* Text Message */}
          {(message.message_type === 'text' || !message.message_type) && (
            <div className="px-4 py-2">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
          
          {/* Timestamp and Status */}
          <div className="px-4 pb-2 flex items-center justify-end space-x-1">
            <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
              {formatTime(message.created_at)}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex space-x-1 mt-1 text-sm">
            {message.reactions.map((reaction, idx) => (
              <span key={idx} className="bg-gray-100 px-2 py-1 rounded-full">
                {reaction.reaction}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition ${
        isOwn ? 'order-1 mr-2' : 'order-2 ml-2'
      }`}>
        <button
          onClick={onReply}
          className="p-1 hover:bg-gray-200 rounded-full"
          title="Reply"
        >
          <Reply size={14} className="text-gray-600" />
        </button>
        {isOwn && (
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-200 rounded-full"
            title="Delete"
          >
            <Trash2 size={14} className="text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};



export default ChatTab;

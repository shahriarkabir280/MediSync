
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { emailApi } from '../../lib/emailApi';
import toast, { Toaster } from 'react-hot-toast';
import {
  Search, Star, StarOff, Trash2, Send, Inbox, FileText,
  Archive, RefreshCw, ChevronLeft, X, Paperclip, MoreVertical,
  Mail, MailOpen, Clock, Users, Reply, Forward, AlertCircle, Check, Edit3, Plus
} from 'lucide-react';

const EmailTab = () => {
  const [emails, setEmails] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsCC, setShowSuggestionsCC] = useState(false);
  const [showSuggestionsBCC, setShowSuggestionsBCC] = useState(false);

  // Resizable columns state
  const [folderWidth, setFolderWidth] = useState(240); // Default 240px
  const [listWidth, setListWidth] = useState(320); // Default 320px
  const isResizingFolder = useRef(false);
  const isResizingList = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const [stats, setStats] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const fileInputRef = useRef(null);

  // Compose email form state
  const [composeForm, setComposeForm] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: [] // Array of File objects
  });

  // Load stats on mount
  useEffect(() => {
    loadStats();
    loadRecipients();
  }, []);

  // Global resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingFolder.current) {
        const delta = e.clientX - resizeStartX.current;
        const newWidth = Math.max(160, Math.min(400, resizeStartWidth.current + delta));
        setFolderWidth(newWidth);
      }
      if (isResizingList.current) {
        const delta = e.clientX - resizeStartX.current;
        const newWidth = Math.max(250, Math.min(600, resizeStartWidth.current + delta));
        setListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingFolder.current = false;
      isResizingList.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [folderWidth]); // Dependency on folderWidth for list calc might be needed or use refs for absolute positions

  // Load emails when folder changes
  useEffect(() => {
    loadEmails();
  }, [selectedFolder, searchQuery]);

  const loadStats = async () => {
    try {
      const response = await emailApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load email stats:', error);
    }
  };

  const loadEmails = async () => {
    setLoading(true);
    try {
      const params = {
        folder: selectedFolder,
        search: searchQuery || '',
        limit: 50
      };
      console.log('Fetching emails with params:', params);
      const response = await emailApi.getEmails(params);
      console.log('Email response:', response);

      if (response && response.data && Array.isArray(response.data.emails)) {
        setEmails(response.data.emails || []);
      } else if (response && Array.isArray(response.emails)) {
        // Handle potential direct return
        setEmails(response.emails || []);
      } else {
        console.warn('Unexpected email response structure:', response);
        setEmails([]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast.error('Failed to load emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await emailApi.getRecipients();
      setRecipients(response.data || []);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);

    // Mark as read if unread
    if (!email.is_read) {
      try {
        await emailApi.markAsRead(email.id, true);
        // Update local state
        setEmails(prev => prev.map(e =>
          e.id === email.id ? { ...e, is_read: true } : e
        ));
        loadStats();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleToggleStar = async (emailId, currentStarred, e) => {
    e?.stopPropagation();
    try {
      await emailApi.toggleStar(emailId, !currentStarred);
      toast.success(currentStarred ? 'Removed from starred' : 'Email starred', {
        position: 'bottom-center',
        duration: 2000
      });
      setEmails(prev => prev.map(e =>
        e.id === emailId ? { ...e, is_starred: !currentStarred } : e
      ));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => ({ ...prev, is_starred: !currentStarred }));
      }
      loadStats();
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (emailId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this email?')) return;

    try {
      await emailApi.deleteEmail(emailId, false);
      toast.success('Email moved to trash');
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      loadStats();
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast.error('Failed to delete email');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setComposeForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
    }
  };

  const removeAttachment = (index) => {
    setComposeForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSendEmail = async (isDraft = false) => {
    if (!isDraft && (!composeForm.to || !composeForm.subject || !composeForm.body)) {
      toast.error('Please fill in recipient, subject, and message');
      return;
    }

    try {
      if (isDraft) {
        setSavingDraft(true);
      } else {
        setSending(true);
      }

      let payload;
      const hasAttachments = composeForm.attachments.length > 0;

      if (hasAttachments) {
        const formData = new FormData();
        formData.append('recipient_email', composeForm.to);
        formData.append('subject', composeForm.subject);
        formData.append('body', composeForm.body);
        if (composeForm.cc) formData.append('cc', composeForm.cc);
        if (composeForm.bcc) formData.append('bcc', composeForm.bcc);

        composeForm.attachments.forEach(file => {
          formData.append('attachments', file);
        });
        payload = formData;
      } else {
        payload = {
          recipient_email: composeForm.to,
          subject: composeForm.subject,
          body: composeForm.body,
          cc: composeForm.cc || undefined,
          bcc: composeForm.bcc || undefined
        };
      }

      if (isDraft) {
        await emailApi.saveDraft(payload);
        toast.success('Draft saved successfully');
      } else {
        await emailApi.sendEmail(payload);
        toast.success('Email sent successfully');
      }

      setIsComposing(false);
      resetComposeForm();
      loadEmails();
      loadStats();
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
      setSavingDraft(false);
    }
  };

  const resetComposeForm = () => {
    setComposeForm({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      attachments: []
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCompose = () => {
    setIsComposing(true);
    // don't clear selected email behind modal
    resetComposeForm();
  };

  const handleReply = (email) => {
    setIsComposing(true);
    // Don't clear selected email, just open compose
    setComposeForm({
      to: email.sender_email,
      cc: '',
      bcc: '',
      subject: `Re: ${email.subject} `,
      body: `\n\n-- - Original Message-- -\nFrom: ${email.sender_name} <${email.sender_email}>\nDate: ${new Date(email.created_at).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
      attachments: []
    });
  };

  const handleForward = (email) => {
    setIsComposing(true);
    setComposeForm({
      to: '',
      cc: '',
      bcc: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${email.sender_name} <${email.sender_email}>\nDate: ${new Date(email.created_at).toLocaleString()}\nSubject: ${email.subject}\n\n${email.body}`,
      attachments: []
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const folders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: stats?.inbox || 0 },
    { id: 'starred', name: 'Starred', icon: Star, count: stats?.starred || 0 },
    { id: 'sent', name: 'Sent', icon: Send, count: stats?.sent || 0 },
    { id: 'drafts', name: 'Drafts', icon: FileText, count: stats?.drafts || 0 },
    { id: 'trash', name: 'Trash', icon: Trash2, count: stats?.trash || 0 }
  ];

  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      const matchesSearch = !searchQuery ||
        email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.sender_email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [emails, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <Toaster />

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 p-4 px-6 flex items-center justify-between z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-sm text-gray-500">Manage your communications and updates</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors w-4 h-4" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
            />
          </div>


        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        <div
          className="bg-gray-50 flex flex-col border-r border-gray-200"
          style={{ width: folderWidth, minWidth: 160 }}
        >
          <div className="p-4">
            <button
              onClick={() => {
                setComposeForm({ to: '', cc: '', bcc: '', subject: '', body: '', attachments: [] });
                setIsComposing(true);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Compose</span>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = selectedFolder === folder.id;

              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setSelectedEmail(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  title={folder.name}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'fill-indigo-50 text-indigo-600' : ''}`} />
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Folder Resizer */}
        <div
          className="w-1 cursor-col-resize hover:bg-indigo-500 active:bg-indigo-600 bg-transparent transition-colors z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingFolder.current = true;
            resizeStartX.current = e.clientX;
            resizeStartWidth.current = folderWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />

        {/* Email List */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}
          style={{ width: listWidth, minWidth: 250 }}
        >
          {/* List Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800 capitalize">{selectedFolder.replace('_', ' ')}</h3>
            {selectedFolder === 'trash' && filteredEmails.length > 0 && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to permanently delete all items in Trash?')) {
                    try {
                      setLoading(true);
                      await emailApi.emptyTrash();
                      toast.success('Trash emptied');
                      loadEmails();
                      loadStats();
                    } catch (err) {
                      toast.error('Failed to empty trash');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors border border-red-100"
              >
                Empty Trash
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">No emails found</p>
              <p className="text-sm">Your {selectedFolder} is empty</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100">
              {filteredEmails.map((email) => {
                // Get initials for avatar
                const name = email.sender_name || email.sender_email;
                const initials = name ? name[0].toUpperCase() : '?';
                const isSelected = selectedEmail?.id === email.id;

                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`group relative p-4 cursor-pointer transition-all border-b border-gray-100 hover:bg-gray-50 
                    ${isSelected ? 'bg-indigo-50/60 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'} 
                    ${!email.is_read ? 'bg-white' : 'bg-white/50'}`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0
                      ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors'}`}>
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-sm truncate pr-2 ${!email.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {name}
                          </h3>
                          <span className={`text-xs whitespace-nowrap flex-shrink-0 ${!email.is_read ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                            {formatDate(email.created_at)}
                          </span>
                        </div>

                        <h4 className={`text-sm mt-0.5 truncate ${!email.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                          {email.subject || '(No Subject)'}
                        </h4>

                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {email.body}
                        </p>
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute right-4 bottom-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 p-1">
                      <button
                        onClick={(e) => handleToggleStar(email.id, email.is_starred, e)}
                        className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${email.is_starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        title={email.is_starred ? "Unstar" : "Star"}
                      >
                        {email.is_starred ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => handleDelete(email.id, e)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Unread Dot (if no avatar highlighting used, but we use bold text + border-l) */}
                    {!email.is_read && !isSelected && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white"></div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* List Resizer */}
        <div
          className="w-1 cursor-col-resize hover:bg-indigo-500 active:bg-indigo-600 bg-transparent transition-colors z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingList.current = true;
            resizeStartX.current = e.clientX;
            resizeStartWidth.current = listWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />

        {/* Email Preview */}
        <div className={`flex-1 bg-white flex flex-col ${!selectedEmail ? 'hidden lg:flex' : 'flex absolute lg:static inset-0 z-20'}`}>
          {selectedEmail ? (
            <>
              {/* Preview Header - Mobile Back Button */}
              <div className="lg:hidden border-b border-gray-200 p-2">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="flex items-center space-x-2 text-gray-600 px-2 py-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </button>
              </div>

              {/* Email Content Header */}
              <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedEmail.subject || '(No Subject)'}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleToggleStar(selectedEmail.id, selectedEmail.is_starred, e)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                      title={selectedEmail.is_starred ? "Unstar" : "Star"}
                    >
                      <Star className={`w-5 h-5 ${selectedEmail.is_starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(selectedEmail.id, e)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {selectedEmail.sender_name?.[0]?.toUpperCase() || selectedEmail.sender_email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{selectedEmail.sender_name}</span>
                        <span className="text-gray-400 text-sm">&lt;{selectedEmail.sender_email}&gt;</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        To: {selectedEmail.recipient_name || 'Me'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(selectedEmail.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>{new Date(selectedEmail.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
                <div className="prose max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedEmail.body}
                </div>

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedEmail.attachments.length} Attachments</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedEmail.attachments.map((att, i) => {
                        const fileName = typeof att === 'object' ? att.name : att;
                        const fileUrl = typeof att === 'object' ? (att.url ? `http://localhost:3001${att.url}` : '#') : '#';

                        return (
                          <a
                            key={i}
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer text-left group"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-600 transition-colors">{fileName}</p>
                              <p className="text-xs text-gray-400">
                                {typeof att === 'object' && att.size ? `${Math.round(att.size / 1024)} KB` : 'Attachment'}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply/Action Bar */}
              <div className="p-4 border-t border-gray-200 bg-white flex items-center space-x-3">
                {selectedFolder === 'drafts' ? (
                  <button
                    onClick={() => {
                      setComposeForm({
                        to: selectedEmail.recipient_email || '',
                        cc: selectedEmail.cc || '',
                        bcc: selectedEmail.bcc || '',
                        subject: selectedEmail.subject || '',
                        body: selectedEmail.body || '',
                        attachments: [] // Re-attaching files from URL is complex, user might need to re-upload for now or we handle it smarter later
                      });
                      setIsComposing(true);
                      // Ideally we'd track this is a draft to delete it after sending, but basic flow first
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2 shadow-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit & Send</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center space-x-2"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => handleForward(selectedEmail)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center space-x-2"
                    >
                      <Forward className="w-4 h-4" />
                      <span>Forward</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30 text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <MailOpen className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</h3>
              <p className="text-gray-500 max-w-xs text-center">Choose an email from the list to view its contents or start a new message.</p>
            </div>
          )}
        </div>
      </div>

      {isComposing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">New Message</h2>
              <button
                onClick={() => setIsComposing(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                {/* To */}
                {/* To */}
                <div className="relative">
                  <span className="absolute left-0 top-2.5 text-gray-500 font-medium text-sm">To:</span>
                  <input
                    type="email"
                    value={composeForm.to}
                    onChange={(e) => {
                      setComposeForm({ ...composeForm, to: e.target.value });
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Recipient"
                    className="w-full pl-8 py-2 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 text-gray-800 placeholder-gray-400 bg-transparent transition-colors"
                    autoComplete="off"
                  />
                  {/* Suggestions Dropdown */}
                  {showSuggestions && composeForm.to && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {recipients
                        .filter(r =>
                          r.email.toLowerCase().includes(composeForm.to.toLowerCase()) ||
                          r.name.toLowerCase().includes(composeForm.to.toLowerCase())
                        )
                        .map((r, i) => (
                          <div
                            key={i}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors flex flex-col border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setComposeForm({ ...composeForm, to: r.email });
                              setShowSuggestions(false);
                            }}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                          >
                            <span className="text-sm font-medium text-gray-900">{r.name}</span>
                            <span className="text-xs text-gray-500">{r.email}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* CC/BCC Toggle - Simplified for UI, just inputs */}
                <div className="grid grid-cols-2 gap-4">
                  {/* CC Field */}
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-gray-500 font-medium text-sm">Cc:</span>
                    <input
                      type="email"
                      value={composeForm.cc}
                      onChange={(e) => {
                        setComposeForm({ ...composeForm, cc: e.target.value });
                        setShowSuggestionsCC(true);
                      }}
                      onFocus={() => setShowSuggestionsCC(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsCC(false), 200)}
                      placeholder=""
                      className="w-full pl-8 py-2 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 text-gray-800 placeholder-gray-400 bg-transparent transition-colors"
                      autoComplete="off"
                    />
                    {showSuggestionsCC && composeForm.cc && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {recipients
                          .filter(r =>
                            r.email.toLowerCase().includes(composeForm.cc.toLowerCase()) ||
                            r.name.toLowerCase().includes(composeForm.cc.toLowerCase())
                          )
                          .map((r, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors flex flex-col border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setComposeForm({ ...composeForm, cc: r.email });
                                setShowSuggestionsCC(false);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <span className="text-sm font-medium text-gray-900">{r.name}</span>
                              <span className="text-xs text-gray-500">{r.email}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* BCC Field */}
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-gray-500 font-medium text-sm">Bcc:</span>
                    <input
                      type="email"
                      value={composeForm.bcc}
                      onChange={(e) => {
                        setComposeForm({ ...composeForm, bcc: e.target.value });
                        setShowSuggestionsBCC(true);
                      }}
                      onFocus={() => setShowSuggestionsBCC(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsBCC(false), 200)}
                      placeholder=""
                      className="w-full pl-10 py-2 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 text-gray-800 placeholder-gray-400 bg-transparent transition-colors"
                      autoComplete="off"
                    />
                    {showSuggestionsBCC && composeForm.bcc && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {recipients
                          .filter(r =>
                            r.email.toLowerCase().includes(composeForm.bcc.toLowerCase()) ||
                            r.name.toLowerCase().includes(composeForm.bcc.toLowerCase())
                          )
                          .map((r, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors flex flex-col border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setComposeForm({ ...composeForm, bcc: r.email });
                                setShowSuggestionsBCC(false);
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <span className="text-sm font-medium text-gray-900">{r.name}</span>
                              <span className="text-xs text-gray-500">{r.email}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="Subject"
                  className="w-full px-0 py-2 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 text-lg font-medium text-gray-800 placeholder-gray-400 bg-transparent"
                />

                {/* Body */}
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  placeholder="Write your message..."
                  className="w-full h-48 py-4 resize-none focus:outline-none text-gray-700 leading-relaxed custom-scrollbar"
                />

                {/* Attachments List */}
                {composeForm.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {composeForm.attachments.map((file, i) => (
                      <div key={i} className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                        <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                  title="Attach File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSendEmail(true)} // Draft
                  disabled={sending || savingDraft}
                  className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {savingDraft ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Draft</span>
                  )}
                </button>
                <button
                  onClick={() => handleSendEmail(false)}
                  disabled={sending || savingDraft}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTab;
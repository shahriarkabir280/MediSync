
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { emailApi } from '../../lib/emailApi';
import toast, { Toaster } from 'react-hot-toast';
import {
  Inbox, FileText, ChevronLeft,
  Mail, MailOpen, Reply, Forward, Plus, Filter,
  Star, Send, Trash2, Menu, X
} from 'lucide-react';
import {
  FolderSidebar,
  EmailListItem,
  EmailPreview,
  ComposeWindow,
  Toolbar
} from './EmailComponents';

const EmailTab = () => {
  const [emails, setEmails] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestionsCC, setShowSuggestionsCC] = useState(false);
  const [showSuggestionsBCC, setShowSuggestionsBCC] = useState(false);
  const [isComposeMinimized, setIsComposeMinimized] = useState(false);

  const [stats, setStats] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const fileInputRef = useRef(null);

  // Compose email form state
  const [composeForm, setComposeForm] = useState({
    id: null,
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


  // Load emails when folder changes
  useEffect(() => {
    loadEmails();
  }, [selectedFolder, searchQuery]);

  // Auto-save draft effect
  useEffect(() => {
    if (!isComposing || sending || savingDraft) return;

    // Check if there's anything to save
    const hasContent = composeForm.to || composeForm.subject || composeForm.body;
    if (!hasContent) return;

    const timer = setTimeout(() => {
      console.log('Auto-saving draft...');
      handleSendEmail(true, true); // true for isDraft, true for isSilent
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [composeForm.to, composeForm.subject, composeForm.body, isComposing]);

  const loadStats = async () => {
    try {
      const response = await emailApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load email stats:', error);
    }
  };

  const loadEmails = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
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

  const handleSendEmail = async (isDraft = false, isSilent = false) => {
    if (!isDraft && (!composeForm.to || !composeForm.subject || !composeForm.body)) {
      if (!isSilent) toast.error('Please fill in recipient, subject, and message');
      return;
    }

    // Don't auto-save if everything is empty
    if (isSilent && !composeForm.to && !composeForm.subject && !composeForm.body) {
      return;
    }

    try {
      if (isDraft) {
        if (!isSilent) setSavingDraft(true);
      } else {
        setSending(true);
      }

      let payload;
      const hasAttachments = composeForm.attachments.length > 0;

      if (hasAttachments) {
        const formData = new FormData();
        if (composeForm.id) formData.append('id', composeForm.id);
        formData.append('recipient_email', composeForm.to);
        formData.append('subject', composeForm.subject);
        formData.append('body', composeForm.body);
        if (composeForm.cc) formData.append('cc', composeForm.cc);
        if (composeForm.bcc) formData.append('bcc', composeForm.bcc);

        const newAttachments = [];
        const existingAttachments = [];

        composeForm.attachments.forEach(file => {
          if (file instanceof File) {
            newAttachments.push(file);
          } else {
            existingAttachments.push(file);
          }
        });

        newAttachments.forEach(file => {
          formData.append('attachments', file);
        });

        if (existingAttachments.length > 0) {
          formData.append('existing_attachments', JSON.stringify(existingAttachments));
        }

        payload = formData;
      } else {
        payload = {
          id: composeForm.id || undefined,
          recipient_email: composeForm.to,
          subject: composeForm.subject,
          body: composeForm.body,
          cc: composeForm.cc || undefined,
          bcc: composeForm.bcc || undefined
        };
      }

      if (isDraft) {
        const response = await emailApi.saveDraft(payload);
        if (response?.data?.id) {
          setComposeForm(prev => ({ ...prev, id: response.data.id }));
        }
        if (!isSilent) toast.success('Draft saved successfully');
      } else {
        await emailApi.sendEmail(payload);
        toast.success('Email sent successfully');
      }

      if (!isSilent) {
        setIsComposing(false);
        resetComposeForm();
      }

      // Always refresh to show new draft/sent mail
      loadEmails(isSilent);
      loadStats();
    } catch (error) {
      console.error('Failed to send email:', error);
      if (!isSilent) {
        toast.error('Failed to send email: ' + (error.response?.data?.error || error.message));
      }
    } finally {
      if (isDraft) {
        setSavingDraft(false);
      } else {
        setSending(false);
      }
    }
  };

  const handleCloseCompose = () => {
    const hasContent = composeForm.to || composeForm.subject || composeForm.body || composeForm.attachments.length > 0;
    if (hasContent) {
      toast.success('Message saved as draft', {
        icon: '📁',
        duration: 3000
      });
    }
    setIsComposing(false);
    resetComposeForm();
  };

  const resetComposeForm = () => {
    setComposeForm({
      id: null,
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
    setIsComposeMinimized(false);
    // don't clear selected email behind modal
    resetComposeForm();
  };

  const handleReply = (email) => {
    setIsComposing(true);
    setIsComposeMinimized(false);
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
    setIsComposeMinimized(false);
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
    <div className="flex h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] bg-background overflow-hidden relative font-sans antialiased text-foreground">
      <Toaster />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Folder Sidebar - Responsive Drawer on Mobile, Fixed on Desktop */}
        <div
          className={`fixed inset-y-0 left-0 z-[70] lg:relative lg:z-10 bg-card border-r border-border/50 transition-all duration-300 transform w-64 md:w-56 lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <FolderSidebar
            folders={folders}
            selectedFolder={selectedFolder}
            setSelectedFolder={(f) => {
              setSelectedFolder(f);
              setSelectedEmail(null);
              setIsSidebarOpen(false); // Close drawer on selection
            }}
            onCompose={handleCompose}
            stats={stats}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={true}
          />
        </div>


        {/* List Section - Stacked on Mobile, Width restricted on Desktop */}
        <div
          className={`bg-card md:border-r border-border/50 flex flex-col transition-all duration-300 w-full md:w-80 lg:w-[400px] ${selectedEmail ? 'hidden md:flex' : 'flex'
            }`}
        >
          <div className="lg:hidden p-4 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-muted text-foreground transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black tracking-tight capitalize">{selectedFolder}</h2>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <Toolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedFolder={selectedFolder}
            filteredEmails={filteredEmails}
            onEmptyTrash={async () => {
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
          />

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-[1.5rem] border-4 border-indigo-600/10"></div>
                <div className="absolute inset-0 rounded-[1.5rem] border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/40 animate-pulse">Syncing Encrypted Inbox</p>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-indigo-600/20 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-indigo-600/20 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-indigo-600/20 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-muted/20 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mb-6 md:mb-8 transform rotate-6 shadow-inner border border-border/50">
                <Inbox className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground/20" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight mb-2 md:mb-3">No messages yet</h3>
              <p className="text-xs md:text-sm font-medium text-muted-foreground/40 max-w-[200px] leading-relaxed mx-auto italic">
                "{searchQuery ? 'No matches found.' : 'Your inbox is clear.'}"
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/20">
              {filteredEmails.map((email) => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  isSelected={selectedEmail?.id === email.id}
                  onClick={() => handleSelectEmail(email)}
                  onToggleStar={handleToggleStar}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>


        {/* Email Preview Section - Full Screen on Mobile */}
        <div className={`flex-1 flex flex-col min-w-0 bg-background ${selectedEmail ? 'flex' : 'hidden md:flex'}`}>
          <EmailPreview
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onToggleStar={handleToggleStar}
            onDelete={handleDelete}
            onReply={handleReply}
            onForward={handleForward}
            onEditDraft={(email) => {
              setComposeForm({
                id: email.id,
                to: email.recipient_email || '',
                cc: email.cc || '',
                bcc: email.bcc || '',
                subject: email.subject || '',
                body: email.body || '',
                attachments: email.attachments || []
              });
              setIsComposing(true);
              setIsComposeMinimized(false);
            }}
            selectedFolder={selectedFolder}
          />
        </div>
      </div>

      {/* Compose Window */}
      {isComposing && (
        <ComposeWindow
          form={composeForm}
          setForm={setComposeForm}
          onClose={handleCloseCompose}
          onSend={() => handleSendEmail(false)}
          onSaveDraft={() => handleSendEmail(true)}
          recipients={recipients}
          sending={sending}
          savingDraft={savingDraft}
          isMinimized={isComposeMinimized}
          setIsMinimized={setIsComposeMinimized}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          removeAttachment={removeAttachment}
        />
      )}
    </div>
  );
};

export default EmailTab;

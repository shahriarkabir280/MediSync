import React from 'react';
import { Star, Send, Trash2, Archive, Plus, Search, Check, X, FileText, Paperclip, Reply, Forward, AlertCircle, ChevronLeft, Filter, Clock, Mail } from 'lucide-react';

export const FolderSidebar = ({ folders, selectedFolder, setSelectedFolder, onCompose, stats, onClose, isMobile }) => {
    return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Mobile Header in Sidebar */}
            <div className="lg:hidden p-6 flex justify-between items-center border-b border-border/50">
                <span className="text-xl font-black text-indigo-600">Folders</span>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <div className="p-4 sm:p-6">
                <button
                    onClick={onCompose}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group"
                >
                    <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-sm tracking-tight">Compose</span>
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
                {folders.map((folder) => {
                    const Icon = folder.icon;
                    const isActive = selectedFolder === folder.id;

                    return (
                        <button
                            key={folder.id}
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'bg-indigo-50 text-indigo-600 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.1)]'
                                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                            )}
                            <div className="flex items-center space-x-3">
                                <Icon className={`w-4.5 h-4.5 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600' : 'group-hover:scale-110'}`} />
                                <span className={`text-[13px] font-semibold tracking-tight ${isActive ? 'font-bold' : ''}`}>
                                    {folder.name}
                                </span>
                            </div>
                            {folder.count > 0 && (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
                                    }`}>
                                    {folder.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Storage Indicator - Pro Touch */}
            <div className="p-6 mt-auto border-t border-border/50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Storage</span>
                    <span className="text-[10px] font-bold text-indigo-600">75%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-3/4 rounded-full transition-all duration-1000" />
                </div>
            </div>
        </div>
    );
};

export const EmailListItem = ({ email, isSelected, onClick, onToggleStar, onDelete, onMoveToFolder, formatDate }) => {
    return (
        <div
            onClick={onClick}
            className={`group relative p-3 sm:p-4 hover:bg-muted/30 transition-all duration-300 cursor-pointer border-l-[3px] ${isSelected
                ? 'bg-indigo-50/50 border-indigo-600 shadow-sm'
                : 'border-transparent hover:border-border'
                }`}
        >
            <div className="flex items-start justify-between mb-1 gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all shadow-sm shrink-0 ${email.is_read ? 'bg-muted text-muted-foreground' : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-indigo-100'
                        }`}>
                        {email.sender_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between sm:justify-start sm:space-x-2">
                            <p className={`text-[12px] sm:text-[13px] truncate ${email.is_read ? 'font-semibold text-muted-foreground' : 'font-black text-foreground'}`}>
                                {email.sender_name}
                            </p>
                            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter shrink-0 sm:hidden">
                                {formatDate(email.created_at)}
                            </span>
                        </div>
                        <p className={`text-[11px] sm:text-[12px] truncate max-w-full ${email.is_read ? 'font-medium text-muted-foreground/60' : 'font-bold text-indigo-600/80'}`}>
                            {email.subject || '(No Subject)'}
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                        {formatDate(email.created_at)}
                    </span>
                    {!email.is_read && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1.5 shadow-sm animate-pulse" />}
                </div>
            </div>

            <div className="flex items-center justify-between mt-2 sm:mt-0">
                <p className="text-[11px] font-medium text-muted-foreground/60 line-clamp-1 ml-10 sm:ml-13 pr-4 flex-1">
                    {email.body?.replace(/<[^>]*>?/gm, '')}
                </p>
                {!email.is_read && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 sm:hidden mr-2" />}
            </div>

            <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                <div className="bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-xl p-0.5 sm:p-1 flex space-x-0.5 sm:space-x-1">
                    <button
                        onClick={(e) => onToggleStar(email.id, email.is_starred, e)}
                        className={`p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors ${email.is_starred ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
                    >
                        {email.is_starred ? <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(email.id, 'archived');
                        }}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-indigo-600 transition-colors"
                    >
                        <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                        onClick={(e) => onDelete(email.id, e)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const EmailPreview = ({ email, onBack, onToggleStar, onDelete, onMoveToFolder, onReply, onForward, onEditDraft, selectedFolder }) => {
    if (!email) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 text-muted-foreground animate-in fade-in duration-500">
            <div className="w-32 h-32 bg-muted/30 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner transform -rotate-3 border border-border/50">
                <Mail className="w-12 h-12 text-muted-foreground/20" />
            </div>
            <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">Your conversation awaits</h3>
            <p className="text-sm font-medium text-muted-foreground/50 max-w-[280px] text-center leading-relaxed">
                Select an email from the left to view its contents, attachments, and history.
            </p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-background animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="p-3 sm:p-5 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all active:scale-90 group"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-foreground group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="h-6 w-px bg-border/50 hidden sm:block" />
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                            onClick={() => onToggleStar(email.id, email.is_starred)}
                            className={`p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all ${email.is_starred ? 'text-amber-500' : 'text-muted-foreground'}`}
                        >
                            {email.is_starred ? <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Star className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                        <button
                            onClick={() => onDelete(email.id)}
                            className="p-2 sm:p-2.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all"
                        >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                        onClick={() => onMoveToFolder(email.id, 'archived')}
                        className="p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all text-muted-foreground hidden sm:block"
                    >
                        <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="h-6 w-px bg-border/50 hidden sm:block" />
                    <button
                        onClick={() => onMoveToFolder(email.id, 'spam')}
                        className="p-2 sm:p-2.5 hover:bg-muted rounded-xl transition-all text-muted-foreground"
                    >
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 md:p-12">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 lg:mb-12">
                    <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl shadow-indigo-100 shrink-0 transform rotate-2">
                            {email.sender_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2 min-w-0">
                                <span className="font-black text-lg sm:text-xl text-foreground tracking-tight truncate shrink-0">{email.sender_name}</span>
                                <span className="text-muted-foreground/60 text-[10px] sm:text-xs font-mono font-medium truncate shrink">/ {email.sender_email}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">To:</span>
                                <span className="bg-indigo-50 text-indigo-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/10 truncate">
                                    {email.recipient_name || 'Me'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left lg:text-right border-l-2 lg:border-l-0 lg:border-r-2 border-indigo-600/10 pl-4 lg:pl-0 lg:pr-4 shrink-0">
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            {new Date(email.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-base sm:text-lg font-black text-indigo-600 mt-0.5 sm:mt-1">
                            {new Date(email.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="mb-8 sm:mb-12">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tighter leading-tight mb-4 sm:mb-6">
                        {email.subject || '(No Subject)'}
                    </h1>
                    <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-indigo-600 to-transparent rounded-full" />
                </div>

                {/* Body */}
                <div className="prose prose-sm lg:prose-base max-w-none text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap bg-card p-10 rounded-[2.5rem] shadow-sm border border-border/50">
                    {email.body}
                </div>

                {email.attachments && email.attachments.length > 0 && (
                    <div className="mt-10 pt-10 border-t border-border/50">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center space-x-2">
                                <Paperclip className="w-4 h-4 text-indigo-600" />
                                <span>{email.attachments.length} Attachments</span>
                            </h4>

                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {email.attachments.map((att, i) => {
                                const fileName = typeof att === 'object' ? att.name : att;
                                const fileUrl = typeof att === 'object' ? (att.url ? `http://localhost:3001${att.url}` : '#') : '#';

                                return (
                                    <a
                                        key={i}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-4 bg-card border border-border rounded-[1.25rem] hover:shadow-lg hover:border-indigo-500/20 transition-all cursor-pointer group hover:-translate-y-1"
                                    >
                                        <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mr-4 text-muted-foreground group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-bold text-foreground truncate group-hover:text-indigo-600 transition-colors">{fileName}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
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

            {/* Action Bar */}
            <div className="p-4 sm:p-6 border-t border-border/50 bg-card/80 backdrop-blur-md sticky bottom-0 flex items-center space-x-4">
                {selectedFolder === 'drafts' ? (
                    <button
                        onClick={() => onEditDraft(email)}
                        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 flex items-center space-x-2 sm:space-x-3"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Continue Writing</span>
                    </button>
                ) : (
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <button
                            onClick={() => onReply(email)}
                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 flex items-center space-x-2 sm:space-x-3"
                        >
                            <Reply className="w-4 h-4" />
                            <span>Reply</span>
                        </button>
                        <button
                            onClick={() => onForward(email)}
                            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-muted text-foreground rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-border transition-all active:scale-95 flex items-center space-x-2 sm:space-x-3"
                        >
                            <Forward className="w-4 h-4" />
                            <span>Forward</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ComposeWindow = ({
    form,
    setForm,
    onClose,
    onSend,
    onSaveDraft,
    recipients,
    sending,
    savingDraft,
    isMinimized,
    setIsMinimized,
    fileInputRef,
    onFileChange,
    removeAttachment
}) => {
    const [showSuggestions, setShowSuggestions] = React.useState({ to: false, cc: false, bcc: false });

    if (isMinimized) {
        return (
            <div className="fixed bottom-0 right-0 sm:right-8 w-full sm:w-80 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white sm:rounded-t-2xl shadow-2xl z-50 transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => setIsMinimized(false)}>
                <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
                    <span className="text-sm font-bold tracking-tight truncate">
                        {form.subject || 'New Message'}
                    </span>
                    <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-white/20 rounded-md"><Plus className="w-4 h-4 rotate-45" /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-0 sm:right-8 w-auto sm:w-[520px] bg-card rounded-xl sm:rounded-b-none sm:rounded-t-xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.5)] z-[100] flex flex-col max-h-[90vh] sm:h-[550px] animate-in slide-in-from-bottom-full duration-500 border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#40444b] text-white">
                <div>
                    <h2 className="text-xs font-black tracking-wider uppercase">New Message</h2>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(true);
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors hidden sm:block"
                    >
                        <ChevronLeft className="w-4 h-4 rotate-270" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-rose-500 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 custom-scrollbar">
                {/* Recipient Fields */}
                <div className="space-y-4">
                    {['to', 'cc', 'bcc'].map((field) => (
                        <div key={field} className="relative group">
                            <span className="absolute left-0 top-3 text-[10px] font-black uppercase tracking-widest text-indigo-600/40">
                                {field}:
                            </span>
                            <input
                                type="text"
                                value={form[field]}
                                onChange={(e) => {
                                    setForm({ ...form, [field]: e.target.value });
                                    setShowSuggestions({ ...showSuggestions, [field]: true });
                                }}
                                onFocus={() => setShowSuggestions({ ...showSuggestions, [field]: true })}
                                onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, [field]: false }), 200)}
                                placeholder={field === 'to' ? "Recipients" : ""}
                                className="w-full pl-10 py-2 border-b border-border focus:border-indigo-600 focus:ring-0 text-[13px] font-bold text-foreground placeholder-muted-foreground/30 bg-transparent transition-all outline-none"
                            />
                            {showSuggestions[field] && form[field] && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                    {recipients
                                        .filter(r =>
                                            r.email.toLowerCase().includes(form[field].toLowerCase()) ||
                                            r.name.toLowerCase().includes(form[field].toLowerCase())
                                        )
                                        .map((r, i) => (
                                            <div
                                                key={i}
                                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center space-x-3 group/item border-b border-border/50 last:border-0"
                                                onClick={() => {
                                                    setForm({ ...form, [field]: r.email });
                                                    setShowSuggestions({ ...showSuggestions, [field]: false });
                                                }}
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                                    {r.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground">{r.name}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground/60 tracking-wider font-mono">{r.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Subject */}
                    <div className="relative group">
                        <span className="absolute left-0 top-2 text-[10px] font-black uppercase tracking-widest text-indigo-600/40">Subject:</span>
                        <input
                            type="text"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Subject"
                            className="w-full pl-16 py-2 border-b border-border focus:border-indigo-600 focus:ring-0 text-sm font-bold text-foreground placeholder-muted-foreground/30 bg-transparent transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Editor Area */}
                {/* Body */}
                <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Type your message..."
                    className="flex-1 w-full py-4 text-sm font-medium text-foreground placeholder-muted-foreground/30 bg-transparent resize-none outline-none min-h-[150px]"
                />
            </div>

            {/* Attachments Chips */}
            {form.attachments.length > 0 && (
                <div className="px-4 sm:px-8 py-2 sm:py-4 border-t border-border/50 flex flex-wrap gap-2">
                    {form.attachments.map((file, i) => (
                        <div key={i} className="flex items-center space-x-3 bg-muted/30 p-2 pr-1 rounded-xl border border-border group/chip animate-in zoom-in duration-200">
                            <div className="w-8 h-8 bg-card rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[120px]">{file.name}</span>
                            <button
                                onClick={() => removeAttachment(i)}
                                className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {/* Actions */}
            <div className="px-4 py-3 bg-card border-t border-border/50 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onSend(false)}
                        disabled={sending || savingDraft}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center space-x-2 shadow-lg shadow-indigo-600/10 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {sending ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>

                    <button
                        onClick={() => onSaveDraft(true)}
                        disabled={sending || savingDraft}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                        title="Save Draft"
                    >
                        <AlertCircle className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-all"
                        title="Attach Files"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={onFileChange} />
                </div>
            </div>
        </div>
    );
};

export const Toolbar = ({ searchQuery, setSearchQuery, selectedFolder, filteredEmails, onEmptyTrash, unreadOnly, onToggleUnread, onShowHistory }) => {
    return (
        <div className="p-3 sm:p-4 border-b border-border flex flex-wrap items-center justify-between bg-card gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-[200px]">
                <h3 className="font-black text-base sm:text-lg text-foreground capitalize tracking-tighter shrink-0 hidden sm:block">
                    {selectedFolder.replace('_', ' ')}
                </h3>

                {/* Search Bar - Professional & Responsive */}
                <div className="relative flex-1 group max-w-full sm:max-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xs font-semibold placeholder:text-muted-foreground/40"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
                {selectedFolder === 'trash' && filteredEmails.length > 0 && (
                    <button
                        onClick={onEmptyTrash}
                        className="text-[9px] font-black uppercase tracking-widest px-3 py-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-all border border-destructive/20 flex items-center justify-center"
                    >
                        Empty Trash
                    </button>
                )}
                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={onToggleUnread}
                        className={`p-2 rounded-lg transition-all border border-border/30 flex items-center space-x-2 ${unreadOnly ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'hover:bg-muted text-muted-foreground'}`}
                        title="Filter Unread"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        {unreadOnly && <span className="text-[9px] font-black uppercase tracking-tighter">Unread</span>}
                    </button>
                    <button
                        onClick={onShowHistory}
                        className="p-2 hover:bg-muted rounded-lg transition-colors border border-border/30 text-muted-foreground"
                        title="Activity History"
                    >
                        <Clock className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

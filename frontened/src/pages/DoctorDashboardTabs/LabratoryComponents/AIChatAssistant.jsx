import React from 'react';
import ReactDOM from 'react-dom';
import { Bot, X, Sparkles, Paperclip, Send } from "lucide-react";

const AIChatAssistant = ({
    selectedPatient,
    showAIChatModal,
    setShowAIChatModal,
    chatMessages,
    isTyping,
    chatInput,
    setChatInput,
    handleSendMessage,
    sendQuickMessage,
    chatEndRef
}) => {
    if (!selectedPatient) return null;

    return (
        <>
            {/* AI Chat Floating Button */}
            <button
                onClick={() => setShowAIChatModal(true)}
                className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group active:scale-95 border border-white/20"
                aria-label="Open AI Assistant"
            >
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
            </button>

            {/* AI Chat Modal */}
            {showAIChatModal && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-card rounded-2xl w-full max-w-2xl h-[90vh] md:h-[600px] shadow-2xl flex flex-col relative overflow-hidden border border-border">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center shadow-sm border border-white/20">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Clinical Assistant</h3>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                                            Online • Analyzing {selectedPatient?.first_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAIChatModal(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-muted border border-border text-foreground rounded-bl-none'
                                        }`}>
                                        <div className="leading-relaxed">
                                            {msg.sender === 'ai' ? (
                                                <div className="space-y-2">
                                                    {msg.text.split('\n').map((line, i) => (
                                                        <p key={i}>{line}</p>
                                                    ))}
                                                </div>
                                            ) : msg.text}
                                        </div>
                                        <div className={`text-[9px] mt-1.5 opacity-60 font-bold uppercase ${msg.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                            {msg.timestamp}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-muted border border-border rounded-2xl rounded-bl-none px-4 py-2 flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Modal Footer (Input) */}
                        <div className="p-4 border-t border-border bg-muted/10">
                            {/* Suggested Actions */}
                            {!isTyping && chatMessages.length < 5 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                                    {['Analyze Trends', 'Interactions', 'Summarize'].map(action => (
                                        <button
                                            key={action}
                                            onClick={() => sendQuickMessage(action)}
                                            className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider bg-background hover:bg-muted border border-border text-muted-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center"
                                        >
                                            <Sparkles className="w-3 h-3 mr-1.5 text-blue-500" /> {action}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <form onSubmit={handleSendMessage} className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask about this patient..."
                                        className="w-full bg-background border border-border focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() || isTyping}
                                        className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AIChatAssistant;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Send, Paperclip, Smile, MoreVertical, MoreHorizontal, MapPin, RotateCcw,
  Phone, Video, PhoneMissed, PhoneOff, ArrowLeft, ArrowRight, Check, CheckCheck, X, Reply, Trash2, Pin, BellOff, Archive,
  Mic, Image, File, StopCircle, Download, Share2, Save, FileText, FileImage, FileVideo, FileAudio,
  ExternalLink, Eye, MessageCircle, Forward, Settings, Info, Lock, Bell, Volume2, Monitor, Moon, Sun,
  Type, Zap, Shield, Users, Copy, Clock, Keyboard, Palette, Circle, Maximize2, Play, Pause
} from 'lucide-react';
import { chatApi } from '../../lib/chatApi';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../contexts/AuthContext';
import VideoCall from '../../components/VideoCall';
import { debounce } from '../../utils/performance';

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `http://localhost:3001${url}`;
};

// Helper to format date strings consistently
const formatAppTime = (date) => {
  if (!date) return '';
  try {
    let utcDate = date;
    if (typeof date === 'string' && !date.includes('Z') && !date.includes('+')) {
      utcDate = date.replace(' ', 'T') + 'Z';
    }
    const d = new Date(utcDate);
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

// URL regex to find links in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Helper to render text with clickable links
const LinkifiedText = ({ content, isOwn }) => {
  if (!content) return null;

  const parts = content.split(URL_REGEX);
  return (
    <p className="text-xs md:text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`${isOwn ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'} underline decoration-2 underline-offset-2 transition-colors font-bold break-all`}
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

// Component to handle link previews
const LinkPreview = ({ content, isOwn }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const urlMatch = content?.match(URL_REGEX);
  const firstUrl = urlMatch ? urlMatch[0] : null;

  useEffect(() => {
    if (!firstUrl) return;

    const fetchPreview = async () => {
      setLoading(true);
      try {
        const response = await chatApi.getLinkPreview(firstUrl);
        if (response && (response.title || response.description || response.image)) {
          setPreview(response);
        }
      } catch (err) {
        console.error('Failed to fetch link preview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [firstUrl]);

  if (!preview && !loading) return null;

  if (loading) {
    return (
      <div className={`mt-2 p-2 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/5'} animate-pulse`}>
        <div className="h-3 w-2/3 bg-current opacity-20 rounded mb-2"></div>
        <div className="h-2 w-full bg-current opacity-10 rounded"></div>
      </div>
    );
  }

  return (
    <div
      className={`mt-2 overflow-hidden rounded-xl border transition-all hover:scale-[1.01] cursor-pointer ${isOwn
        ? 'bg-white/10 border-white/20 hover:bg-white/20'
        : 'bg-black/5 border-black/5 hover:bg-black/10'
        }`}
      onClick={(e) => {
        e.stopPropagation();
        window.open(preview.url || firstUrl, '_blank');
      }}
    >
      {preview.image && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={preview.image}
            alt={preview.title}
            className="w-full h-full object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}
      <div className="p-2.5">
        {preview.siteName && (
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}>
            {preview.siteName}
          </p>
        )}
        <h4 className={`text-[11px] font-black line-clamp-1 mb-1 ${isOwn ? 'text-white' : 'text-foreground'}`}>
          {preview.title || 'Visit Website'}
        </h4>
        {preview.description && (
          <p className={`text-[10px] line-clamp-2 leading-snug ${isOwn ? 'text-indigo-100/70' : 'text-muted-foreground'}`}>
            {preview.description}
          </p>
        )}
      </div>
    </div>
  );
};

// Modern Voice Message Component
const VoiceMessage = ({ url, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      // Some browsers return Infinity if duration isn't loaded yet
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedToggle = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const handleWaveformClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    if (duration > 0) {
      audioRef.current.currentTime = percentage * duration;
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate a mock waveform
  const waveformBars = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      height: 20 + Math.random() * 60, // 20% to 80% height
      id: i
    }));
  }, []);

  return (
    <div className="flex items-center gap-3 py-1 px-0.5 w-full">
      <button
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all transform active:scale-90 hover:scale-105 ${isOwn ? 'bg-white text-indigo-600 shadow-md' : 'bg-indigo-600 text-white shadow-lg'
          }`}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div
          className="flex items-end gap-[2px] h-8 relative cursor-pointer group/wave"
          onClick={handleWaveformClick}
        >
          {waveformBars.map((bar, i) => {
            const progress = (currentTime / (duration || 1)) * 100;
            const barProgress = (i / waveformBars.length) * 100;
            const isActive = barProgress <= progress;

            return (
              <div
                key={bar.id}
                className={`w-[3px] rounded-full transition-all duration-200 group-hover/wave:w-[4px] ${isActive
                  ? (isOwn ? 'bg-white' : 'bg-indigo-600')
                  : (isOwn ? 'bg-white/30' : 'bg-gray-300 dark:bg-white/10')
                  }`}
                style={{ height: `${bar.height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase opacity-80">
          <span className={isOwn ? 'text-indigo-50' : 'text-muted-foreground'}>
            {isPlaying ? formatTime(currentTime) : (duration ? formatTime(duration) : '0:00')}
          </span>
          <audio ref={audioRef} src={getMediaUrl(url)} preload="metadata" />
          <button
            onClick={handleSpeedToggle}
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black transition-all border ${isOwn
              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              : 'bg-black/5 border-black/10 hover:bg-black/10 text-indigo-600'
              }`}
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern Call Summary Component
const CallSummary = ({ content, isOwn }) => {
  const [type, direction, status, duration] = content.split('|');
  const isVideo = type === 'video';
  const viewerDirection = isOwn ? direction : (direction === 'incoming' ? 'outgoing' : 'incoming');
  const isViewerIncoming = viewerDirection === 'incoming';

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: isVideo ? <Video size={16} /> : <Phone size={16} />,
          text: isVideo ? 'Video Call' : 'Audio Call',
          detail: duration !== '0' ? duration : '',
          color: isOwn ? 'text-indigo-100' : 'text-indigo-600',
          bg: isOwn ? 'bg-white/10' : 'bg-indigo-50'
        };
      case 'missed':
        return {
          icon: isViewerIncoming ? <PhoneMissed size={16} /> : <PhoneOff size={16} />,
          text: isViewerIncoming ? 'Missed Call' : 'No Answer',
          detail: '',
          color: 'text-rose-500',
          bg: 'bg-rose-50'
        };
      case 'declined':
        return {
          icon: <PhoneOff size={16} />,
          text: isViewerIncoming ? 'Call Declined' : 'Declined Call',
          detail: '',
          color: 'text-rose-500',
          bg: 'bg-rose-50'
        };
      case 'not_answered':
        return {
          icon: isViewerIncoming ? <PhoneMissed size={16} /> : <PhoneOff size={16} />,
          text: isViewerIncoming ? 'Missed Call' : 'No Answer',
          detail: '',
          color: 'text-rose-500',
          bg: 'bg-rose-50'
        };
      default:
        return {
          icon: <Phone size={16} />,
          text: isVideo ? 'Video Call' : 'Audio Call',
          detail: '',
          color: 'text-muted-foreground',
          bg: 'bg-muted/50'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isOwn ? 'border-white/10 bg-white/5' : 'border-border/50 bg-muted/20'} min-w-[200px]`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg} ${config.color} shadow-sm transition-transform hover:scale-105`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[11px] font-black uppercase tracking-widest ${isOwn ? 'text-white' : 'text-foreground'}`}>
            {config.text}
          </p>
        </div>
        <p className={`text-[9px] font-bold mt-0.5 ${isOwn ? 'text-indigo-100/70' : 'text-muted-foreground'}`}>
          {isViewerIncoming ? 'Incoming' : 'Outgoing'} {config.detail && `• ${config.detail}`}
        </p>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn, isFirst, isLast, onReply, onDelete, onForward, onCopy, onReact, onReplyClick, onPreview }) => {
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);

  // Close actions menu when clicking anywhere else
  React.useEffect(() => {
    if (!showActionsMenu) return;
    const handleClick = () => setShowActionsMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showActionsMenu]);

  const formatTime = (date) => formatAppTime(date);

  const MessageStatus = ({ message }) => {
    const status = message.my_status?.status;
    if (!status) return null;
    if (status === 'read') return <CheckCheck size={12} className="text-blue-400" />;
    if (status === 'delivered') return <CheckCheck size={12} className="text-white/60" />;
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

  const getCorners = () => {
    if (isOwn) {
      return `rounded-[20px] ${isFirst ? 'rounded-tr-lg' : 'rounded-tr-[4px]'} ${isLast ? 'rounded-br-lg' : 'rounded-br-[4px]'}`;
    }
    return `rounded-[20px] ${isFirst ? 'rounded-tl-lg' : 'rounded-tl-[4px]'} ${isLast ? 'rounded-bl-lg' : 'rounded-bl-[4px]'}`;
  };

  return (
    <div id={`message-${message.id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isLast ? 'mb-4' : 'mb-2'} px-0.5 md:px-4 group relative`}>
      <div className={`flex items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'} max-w-[70%] md:max-w-[80%] lg:max-w-[75%] gap-1 transition-all duration-300`}>

        <div className="flex flex-col relative group/bubble">
          {/* Reaction Bar (Hover) */}
          <div className={`absolute -top-7 ${isOwn ? 'right-0' : 'left-0'} opacity-0 ${!showActionsMenu ? 'group-hover/bubble:opacity-100' : ''} transition-all duration-300 transform translate-y-2 ${!showActionsMenu ? 'group-hover/bubble:translate-y-0' : ''} flex items-center bg-card shadow-xl border border-border/50 rounded-full px-2 py-0.5 z-20 gap-1`}>
            {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(message, emoji);
                }}
                className="hover:scale-125 transition-transform px-0.5 text-base"
              >
                {emoji}
              </button>
            ))}
          </div>

          {message.reply_to && message.reply_to_id && (
            <div
              onClick={() => onReplyClick && message.reply_to.id && onReplyClick(message.reply_to.id)}
              className={`mb-px px-3 py-1.5 bg-muted/30 rounded-t-2xl text-[10px] cursor-pointer hover:bg-muted/50 transition-colors ${isOwn ? 'ml-1 mr-1' : 'ml-1 mr-1'
                } ${message.media_url
                  ? 'w-[200px] md:w-[240px] lg:w-[260px]'
                  : 'w-[240px] md:w-[280px] lg:w-[300px]'
                }`}
            >
              <p className="font-bold text-indigo-600 truncate">↩ {message.reply_to.sender_name}</p>
              <p className="text-muted-foreground line-clamp-2 italic break-words">{message.reply_to.content}</p>
            </div>
          )}

          <div
            className={`relative p-2.5 transition-all duration-300 shadow-sm ${getCorners()} ${isOwn
              ? 'bg-indigo-600 text-white'
              : 'bg-[#E4E6EB] dark:bg-muted/60 text-foreground'
              } ${message.reply_to && message.reply_to_id ? 'rounded-t-none' : ''} ${message.media_url
                ? 'w-[200px] md:w-[240px] lg:w-[260px]'
                : 'w-[240px] md:w-[280px] lg:w-[300px]'
              }`}
          >
            {/* Forwarded Tag */}
            {message.is_forwarded && (
              <div className={`flex items-center gap-1 mb-1 opacity-60 ${isOwn ? 'text-indigo-50' : 'text-muted-foreground'}`}>
                <Forward size={10} className="stroke-[3]" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Forwarded</span>
              </div>
            )}
            {/* Media Content */}
            {message.media_url && (
              <div className={`overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 ${message.content ? 'mb-2' : ''
                } w-full`}>
                {message.media_type?.startsWith('image/') ? (
                  <div className="relative group/media overflow-hidden">
                    <img
                      src={getMediaUrl(message.media_url)}
                      alt="Media"
                      className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-all duration-300"
                      onClick={() => onPreview({ url: message.media_url, type: 'image', name: message.media_name })}
                    />
                    {/* Premium Action Overlay - Now Direct & Always Visible */}
                    <div className="absolute inset-x-0 bottom-0 py-3 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center gap-3 transition-opacity duration-300 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview({ url: message.media_url, type: 'image', name: message.media_name });
                        }}
                        className="p-2 bg-white/10 backdrop-blur-md hover:bg-white/30 rounded-full transition-all hover:scale-110 active:scale-90 border border-white/10"
                        title="View Fullscreen"
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                      <a
                        href={getMediaUrl(message.media_url)}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-white/10 backdrop-blur-md hover:bg-white/30 rounded-full transition-all hover:scale-110 active:scale-90 border border-white/10"
                        title="Download Image"
                      >
                        <Download size={16} className="text-white" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Saved to your gallery', 'success');
                        }}
                        className="p-2 bg-white/10 backdrop-blur-md hover:bg-white/30 rounded-full transition-all hover:scale-110 active:scale-90 border border-white/10"
                        title="Save to Gallery"
                      >
                        <Save size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                ) : message.media_type?.startsWith('video/') ? (
                  <video controls className="w-full max-h-[300px]">
                    <source src={getMediaUrl(message.media_url)} type={message.media_type} />
                  </video>
                ) : (message.message_type === 'voice' || message.media_type?.startsWith('audio/')) ? (
                  <div className="p-2 w-full">
                    <VoiceMessage url={message.media_url} isOwn={isOwn} />
                  </div>
                ) : (
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${isOwn ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-600'}`}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-black truncate leading-tight ${isOwn ? 'text-white' : 'text-foreground'}`}>{message.media_name}</p>
                        <p className={`text-[9px] opacity-70 font-bold mt-1 ${isOwn ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                          {(message.media_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    {/* Actions Row - Moved Below Filename per user request */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                      <button
                        onClick={() => onPreview({ url: message.media_url, type: 'file', name: message.media_name })}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${isOwn ? 'hover:bg-white/10' : 'hover:bg-black/5 active:scale-95'}`}
                        title="Quick Preview"
                      >
                        <Eye size={15} className={isOwn ? 'text-white' : 'text-indigo-600'} />
                      </button>
                      <a
                        href={getMediaUrl(message.media_url)}
                        download
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${isOwn ? 'hover:bg-white/10' : 'hover:bg-black/5 active:scale-95'}`}
                        title="Download File"
                      >
                        <Download size={15} className={isOwn ? 'text-white' : 'text-indigo-600'} />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast('Saved to your library', 'success');
                        }}
                        className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-all ${isOwn ? 'hover:bg-white/10' : 'hover:bg-black/5 active:scale-95'}`}
                        title="Save to Library"
                      >
                        <Save size={15} className={isOwn ? 'text-white' : 'text-indigo-600'} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message Content */}
            {message.content && (
              <div className="space-y-2">
                {message.message_type === 'call' ? (
                  <CallSummary content={message.content} isOwn={isOwn} />
                ) : message.content !== message.media_name && (
                  <>
                    <LinkifiedText content={message.content} isOwn={isOwn} />
                    <LinkPreview content={message.content} isOwn={isOwn} />
                  </>
                )}
              </div>
            )}

            {/* Reactions Display */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={`absolute -bottom-2 ${isOwn ? 'left-0' : 'right-0'} flex -space-x-1`}>
                {message.reactions.map((r, idx) => (
                  <div key={idx} className="bg-card shadow-sm border border-border/50 rounded-full px-1 py-0.5 text-[10px] transform hover:scale-110 transition-transform">
                    {r.reaction || r.emoji}
                  </div>
                ))}
              </div>
            )}

            {/* Inline Meta (Time & Status) */}
            <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-70 text-[9px] font-bold ${isOwn ? 'text-indigo-50' : 'text-muted-foreground'}`}>
              {message.isUploading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{message.progress}%</span>
                </div>
              ) : (
                <>
                  <span>{formatTime(message.created_at)}</span>
                  {isOwn && <MessageStatus message={message} />}
                </>
              )}
            </div>
          </div>

          {/* Quick Actions Menu - Outside bubble on all devices */}
          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-all duration-300 flex items-center gap-1 ${isOwn ? '-left-6 md:-left-10 pr-1 md:pr-2' : '-right-6 md:-right-10 pl-1 md:pl-2'}`}>
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
                <div className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} w-24 md:w-28 bg-card border border-border/50 shadow-2xl rounded-xl py-0.5 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReply(message); setShowActionsMenu(false); }}
                    className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] font-bold hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw size={14} className="text-indigo-500" /> Reply
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onForward(message); setShowActionsMenu(false); }}
                    className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] font-bold hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Forward size={14} className="text-emerald-500" /> Forward
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopy(message.content); setShowActionsMenu(false); }}
                    className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] font-bold hover:bg-muted flex items-center gap-2 transition-colors"
                  >
                    <Copy size={14} className="text-amber-500" /> Copy
                  </button>
                  {isOwn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(message.id); setShowActionsMenu(false); }}
                      className="w-full px-2 py-1.5 text-left text-[10px] md:text-[11px] font-bold hover:bg-muted text-rose-500 flex items-center gap-2 transition-colors"
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
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userActivity, setUserActivity] = useState('active'); // active, away, offline
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [scrollTargetId, setScrollTargetId] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // { url, type, name }
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(new Map()); // Map of temporary message ID to upload progress
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Body scroll lock for previews
  useEffect(() => {
    if (previewMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewMedia]);

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
  const chatContainerRef = useRef(null);

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

  // Auto-select most recent chat on load
  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      handleSelectChat(chats[0]);
    }
  }, [chats.length]);

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
      if (selectedChat && data.chatId === selectedChat.id && data.userId !== currentUser.userId) {
        setTypingUsers(prev => new Map(prev).set(`${data.userId}_${data.userType}`, data.userName || 'Someone'));
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (selectedChat && data.chatId === selectedChat.id) {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(`${data.userId}_${data.userType}`);
          return newMap;
        });
      }
    });

    // Reaction added
    socket.on('reaction_added', (data) => {
      setMessages(prev => prev.map(msg =>
        msg.id == data.messageId
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
      if (selectedChat && data.chatId == selectedChat.id) {
        setMessages(prev => prev.map(msg =>
          msg.id == data.messageId
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

  // Smart scroll: to unread or bottom
  const handleSmartScroll = () => {
    setTimeout(() => {
      if (scrollTargetId) {
        const element = document.getElementById(`message-${scrollTargetId}`);
        if (element) {
          // Scroll with better positioning
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

          // Add highlight effect to make it obvious which message we scrolled to
          element.style.transition = 'background-color 0.3s ease';
          element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; // indigo highlight

          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);

          // After finding and scrolling, we reset so future messages scroll to bottom
          setTimeout(() => {
            setScrollTargetId(null);
          }, 500);
          return;
        }
      }
      // Default: scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Simple scroll to bottom (used by sendMessage etc)
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle opening media previews
  const handleOpenPreview = (media) => {
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
    setPreviewMedia(media);
  };

  // Scroll to a specific message (used by reply click)
  const scrollToMessage = (messageId) => {
    if (!messageId) return;

    // Set the target and wait a bit longer for rendering
    setScrollTargetId(messageId);

    // Trigger scroll with a slightly longer delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.getElementById(`message-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

        // Add highlight effect
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';

        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 2000);
      }
    }, 200);
  };


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

      // Find first unread message to scroll to
      if (data.messages && data.messages.length > 0) {
        const firstUnread = data.messages.find(m =>
          m.sender_id !== currentUser.userId && m.my_status?.status !== 'read'
        );

        if (firstUnread) {
          setScrollTargetId(firstUnread.id);
        } else {
          setScrollTargetId(null);
        }

        // Mark as read
        const unreadIds = data.messages
          .filter(m => m.sender_id !== currentUser.userId && m.my_status?.status !== 'read')
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await chatApi.markAsRead(chatId, currentUser.userId, currentUser.userType, unreadIds);
          socket.markAsRead(chatId, unreadIds, currentUser.userId, currentUser.userType);
        }
        handleSmartScroll();
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

  // Handle optimistic file upload
  const handleFileUpload = async (file, messageType = 'file') => {
    if (!selectedChat || !file) return;

    // Create a temporary ID for optimistic rendering
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create optimistic message
    const tempMessage = {
      id: tempId,
      chat_id: selectedChat.id,
      sender_id: currentUser.userId,
      sender_type: currentUser.userType,
      sender_name: currentUser.userName,
      content: '',
      message_type: messageType,
      media_url: URL.createObjectURL(file), // Local preview URL
      media_name: file.name,
      media_size: file.size,
      media_type: file.type,
      created_at: new Date().toISOString(),
      isUploading: true,
      progress: 0,
      my_status: { status: 'sent' }
    };

    // Add to messages list optimistically
    setMessages(prev => [...prev, tempMessage]);
    setUploadQueue(prev => new Map(prev).set(tempId, 0));
    scrollToBottom();

    try {
      // Upload file with progress tracking
      const uploadResponse = await chatApi.uploadFile(file, (progress) => {
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? { ...msg, progress } : msg
        ));
        setUploadQueue(prev => new Map(prev).set(tempId, progress));
      });

      const fileData = uploadResponse.file;

      // Send the actual message
      const response = await chatApi.sendMessage(
        selectedChat.id,
        currentUser,
        file.name || fileData.name || 'File',
        {
          messageType: messageType === 'voice' ? 'voice' : (file.type?.startsWith('image/') ? 'image' : 'file'),
          mediaUrl: fileData.url,
          mediaName: fileData.name,
          mediaSize: fileData.size,
          mediaType: fileData.type || file.type
        }
      );

      // Replace temp message with real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? response.message : msg
      ));

      // Cleanup local preview URL
      if (tempMessage.media_url.startsWith('blob:')) {
        URL.revokeObjectURL(tempMessage.media_url);
      }

      // Cleanup
      setUploadQueue(prev => {
        const next = new Map(prev);
        next.delete(tempId);
        return next;
      });

      // Broadcast via WebSocket
      socket.sendMessage(selectedChat.id, response.message);

      // Update chat list
      updateChatListWithMessage(selectedChat.id, response.message);

    } catch (error) {
      console.error('Error uploading file:', error);
      // Cleanup local preview URL on error
      if (tempMessage.media_url.startsWith('blob:')) {
        URL.revokeObjectURL(tempMessage.media_url);
      }
      // Mark as failed or remove
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert(`Failed to upload ${file.name}: ${error.message}`);
    } finally {
      setShowAttachMenu(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const MAX_SIZE = 25 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          alert(`File ${file.name} exceeds 25MB limit`);
          return;
        }
        handleFileUpload(file);
      });
    }
  };

  // Clipboard Paste Handler
  useEffect(() => {
    const handlePaste = (e) => {
      if (!selectedChat) return;

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (blob) {
            // Give it a name if it's a screenshot
            const file = new File([blob], `screenshot-${Date.now()}.png`, { type: blob.type });
            handleFileUpload(file, file.type.startsWith('image/') ? 'image' : 'file');
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectedChat, currentUser]);

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

    // Check if within 24 hours for "Delete for Everyone"
    const timeLimit = 24 * 60 * 60 * 1000;
    const limitTime = Date.now() - timeLimit;
    const messageTime = new Date(message.created_at).getTime();

    // Allow delete if within time limit OR if it's the very last message (optional leniency)
    const canDelete = messageTime > limitTime;

    setMessageToDelete(message);
    setCanDeleteForEveryone(canDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (deleteForEveryone) => {
    if (!messageToDelete) return;

    try {
      await chatApi.deleteMessage(messageToDelete.id, currentUser.userId, currentUser.userType, deleteForEveryone);

      // Update local state
      if (deleteForEveryone) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageToDelete.id ? { ...msg, is_deleted: true } : msg
        ));
      } else {
        // Delete for Me: Remove from view
        setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id));
      }

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
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [forwardSearchResults, setForwardSearchResults] = useState([]);
  const [isForwardSearching, setIsForwardSearching] = useState(false);
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
      setLoading(true);
      const response = await chatApi.forwardMessage(
        messageToForward.id,
        selectedChatsForForward,
        currentUser.userId,
        currentUser.userType
      );

      const forwardedMessages = response.messages || [];

      // Broadcast each created message via socket and update chat list
      forwardedMessages.forEach(msg => {
        socket.sendMessage(msg.chat_id, msg);
        updateChatListWithMessage(msg.chat_id, msg);
      });

      setShowForwardModal(false);
      setMessageToForward(null);
      setSelectedChatsForForward([]);
      setForwardSearchQuery('');

      // If current chat was one of the recipients, append it locally
      const myForwardedMsg = forwardedMessages.find(m => m.chat_id === selectedChat?.id);
      if (myForwardedMsg) {
        setMessages(prev => [...prev, myForwardedMsg]);
        scrollToBottom();
      }

      alert(`Successfully forwarded to ${response.forwardedCount} chat(s)`);
      loadChats();
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
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

  const debouncedForwardSearchUsers = useMemo(
    () => debounce(async (query) => {
      if (!query.trim() || query.length < 2) {
        setForwardSearchResults([]);
        return;
      }

      try {
        setIsForwardSearching(true);
        const data = await chatApi.searchUsers(query, currentUser.userId, currentUser.userType);
        // Exclude self if they appear
        const filteredUsers = (data.users || []).filter(u => u.user_id !== currentUser.userId);
        setForwardSearchResults(filteredUsers);
      } catch (error) {
        console.error('Error searching users for forward:', error);
        setForwardSearchResults([]);
      } finally {
        setIsForwardSearching(false);
      }
    }, 500),
    [currentUser.userId]
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
    <div className="h-[calc(100vh-110px)] lg:h-[calc(100vh-140px)] w-full flex bg-card rounded-2xl overflow-x-hidden overflow-y-hidden shadow-2xl border border-border animate-in fade-in zoom-in duration-500">
      {/* Left Sidebar - Chat List */}
      <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-[320px] flex-shrink-0 flex-col bg-card/50 backdrop-blur-md border-r border-border`}>
        {/* Modern Glassmorphism Header */}
        <div className="p-2 md:p-4 bg-card/80 backdrop-blur-xl sticky top-0 z-20 border-b border-border">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent font-outfit">
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
                  currentUser={currentUser}
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
        <div
          ref={chatContainerRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex-1 min-w-0 flex flex-col bg-background relative z-30 animate-in slide-in-from-right-4 duration-300"
        >
          {/* Drag & Drop Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-[60] bg-indigo-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 md:p-12 transition-all animate-in fade-in zoom-in duration-300 pointer-events-none">
              <div className="w-full h-full border-4 border-dashed border-white/30 rounded-[40px] flex flex-col items-center justify-center space-y-6 md:space-y-8 animate-pulse text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 animate-ping"></div>
                  <Plus size={48} className="text-white relative z-10" />
                </div>
                <div className="space-y-2 px-4">
                  <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg">Drop to Send</h2>
                  <p className="text-sm md:text-lg font-bold text-white/80 max-w-md mx-auto">
                    Share images, documents, and media seamlessly. Maximum file size: 25MB
                  </p>
                </div>
                <div className="flex gap-4 md:gap-6 pt-4">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                    <Image size={24} className="text-white" />
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                    <Zap size={24} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}
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
            ) : (
              <div className="flex flex-col">
                {/* Messenger-style Chat Introduction */}
                <div className="flex flex-col items-center justify-center py-12 px-6 mb-4 text-center border-b border-border/30 bg-gradient-to-b from-indigo-50/20 to-transparent dark:from-indigo-500/5">
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] opacity-20 group-hover:opacity-30 blur-sm transition-opacity" />
                    {selectedChat.other_user?.user_avatar ? (
                      <img
                        src={getMediaUrl(selectedChat.other_user.user_avatar)}
                        alt={selectedChat.other_user.user_name}
                        className="w-24 h-24 rounded-[2.2rem] object-cover border-2 border-background shadow-2xl relative z-10"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-[2.2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl relative z-10">
                        {selectedChat.other_user?.user_name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-foreground mb-1 font-outfit tracking-tight">
                    {selectedChat.other_user?.user_name}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20 shadow-sm">
                      {selectedChat.other_user?.user_type || 'User'}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">•</span>
                    <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">Connected</span>
                  </div>

                  <p className="max-w-xs text-[11px] font-medium text-muted-foreground/70 leading-relaxed uppercase tracking-wider">
                    This is the very beginning of your consultation history with <span className="text-foreground font-bold">{selectedChat.other_user?.user_name}</span>.
                  </p>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-3xl flex items-center justify-center mb-4 text-muted-foreground/40 border border-border/50">
                      <MessageCircle size={32} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">No messages yet</p>
                    <p className="mt-2 text-[11px] font-medium text-muted-foreground/40 max-w-[200px]">Send a message to start the secure conversation.</p>
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
                        onCopy={() => handleCopyMessage(message.content)}
                        onReact={(msg, emoji) => handleAddReaction(msg, emoji)}
                        onReplyClick={scrollToMessage}
                        onPreview={handleOpenPreview}
                      />
                    );
                  })
                )}
              </div>
            )}

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
              <div className="flex items-center space-x-3 px-6 py-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="flex space-x-1 bg-card px-3 py-2 rounded-2xl shadow-sm border border-border">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                </div>
                <span className="text-[11px] italic text-muted-foreground">
                  {Array.from(typingUsers.values()).join(', ')} is typing...
                </span>
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
          <div className="bg-card border-t border-border px-2 md:px-6 py-3 md:py-4">
            {isRecording ? (
              // Modern Recording UI - Telegram & Messenger inspired
              <div className="flex items-center gap-3 p-1.5 bg-rose-500/5 dark:bg-rose-500/10 backdrop-blur-md rounded-[24px] border border-rose-500/20 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1 flex items-center px-4 gap-4">
                  {/* Blinking Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="relative w-2.5 h-2.5">
                      <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-40"></div>
                      <div className="relative w-full h-full bg-rose-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.4)]"></div>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 font-outfit tabular-nums">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Consistent Waveform Animation */}
                  <div className="flex-1 flex items-center justify-center gap-[2px] h-8">
                    {[...Array(24)].map((_, i) => (
                      <div
                        key={i}
                        className="w-[3px] bg-rose-500/30 rounded-full animate-[pulse_1.5s_infinite]"
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-1.5">
                  <button
                    onClick={cancelRecording}
                    className="group flex items-center gap-1.5 px-3 py-2 rounded-2xl hover:bg-rose-500/10 text-rose-600/60 hover:text-rose-600 transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                    <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={stopRecording}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] transition-all transform hover:scale-110 active:scale-90 flex items-center justify-center"
                    title="Send Voice Message"
                  >
                    <Send size={18} fill="currentColor" />
                  </button>
                </div>
              </div>
            ) : (
              // Normal input UI
              <div className="flex items-center space-x-2">
                {/* Modern Attachment Menu - Telegram Inspired */}
                <div className="relative">
                  <button
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`p-2.5 rounded-2xl transition-all duration-500 flex items-center justify-center ${showAttachMenu
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 rotate-45 scale-110'
                      : 'bg-muted/50 text-slate-500 hover:bg-muted hover:text-indigo-600 hover:rotate-12'
                      }`}
                    disabled={uploadingFile}
                  >
                    <Plus size={22} className="transition-transform duration-500" />
                  </button>

                  {showAttachMenu && (
                    <div className="absolute bottom-full mb-5 left-0 w-72 max-w-[calc(100vw-40px)] bg-card/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/20 p-4 space-y-2 animate-in slide-in-from-bottom-6 zoom-in-95 duration-500 z-50 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50"></div>
                      <div className="px-4 py-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 font-outfit">Share Attachment</p>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center space-x-4 px-4 py-3.5 hover:bg-indigo-50/50 rounded-3xl text-left transition-all duration-300 group relative overflow-hidden"
                        >
                          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10">
                            <Image size={20} className="text-white" />
                          </div>
                          <div className="flex-1 relative z-10">
                            <span className="text-sm font-black text-slate-800 block">Gallery</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Photos & Videos</p>
                          </div>
                          <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors duration-300"></div>
                        </button>

                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.doc,.docx,.txt,.zip,.rar';
                            input.onchange = (e) => handleFileSelect(e, 'document');
                            input.click();
                          }}
                          className="w-full flex items-center space-x-4 px-4 py-3.5 hover:bg-emerald-50/50 rounded-3xl text-left transition-all duration-300 group relative overflow-hidden"
                        >
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-100 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 relative z-10">
                            <FileText size={20} className="text-white" />
                          </div>
                          <div className="flex-1 relative z-10">
                            <span className="text-sm font-black text-slate-800 block">Document</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">PDF, DOC, ZIP</p>
                          </div>
                          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors duration-300"></div>
                        </button>

                        <button
                          onClick={handleShareLocation}
                          className="w-full flex items-center space-x-4 px-4 py-3.5 hover:bg-amber-50/50 rounded-3xl text-left transition-all duration-300 group relative overflow-hidden"
                        >
                          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-100 group-hover:scale-110 transition-all duration-300 relative z-10">
                            <MapPin size={20} className="text-white" />
                          </div>
                          <div className="flex-1 relative z-10">
                            <span className="text-sm font-black text-slate-800 block">Location</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Live Location</p>
                          </div>
                          <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-300"></div>
                        </button>
                      </div>
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
                    className="p-2.5 bg-indigo-50 text-indigo-600/70 hover:bg-indigo-600 hover:text-white rounded-xl transition-all transform hover:rotate-12 hover:scale-110 active:scale-90 border border-indigo-100/50 shadow-sm"
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

      {/* Delete Message Modal - Simplified Messenger Style */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 backdrop-blur-[2px]">
          <div
            className="bg-card w-full max-w-[320px] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border/40"
          >
            <div className="p-4 text-center border-b border-border/40">
              <h3 className="text-[15px] font-semibold text-foreground">Who do you want to remove this message for?</h3>
            </div>

            <div className="flex flex-col divide-y divide-border/40">
              {/* Unsend / Delete for Everyone */}
              {canDeleteForEveryone && (
                <button
                  onClick={() => confirmDelete(true)}
                  className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors flex flex-col items-start active:bg-muted/60"
                >
                  <span className="text-[15px] font-medium text-rose-500">Unsend</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">Message will be removed for everyone in the chat</span>
                </button>
              )}

              {/* Remove for you */}
              <button
                onClick={() => confirmDelete(false)}
                className="w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors flex flex-col items-start active:bg-muted/60"
              >
                <span className="text-[15px] font-medium text-foreground">Remove for you</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Message will be removed for you. Others can still see it</span>
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full text-center py-3.5 font-medium text-primary hover:bg-muted/40 transition-colors text-[15px]"
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

      {/* Forward Message Modal - Modern Messenger Style */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[32px] sm:rounded-3xl shadow-2xl w-[88%] sm:w-full sm:max-w-[420px] h-[50vh] sm:h-[600px] mb-8 sm:mb-0 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border border-border/50">
            {/* Mobile Drag Handle */}
            <div className="flex sm:hidden justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-card">
              <h3 className="text-lg font-bold text-foreground font-outfit">Forward</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardSearchQuery('');
                  setForwardSearchResults([]);
                }}
                className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-border/50 bg-card/50">
              <div className="relative group">
                {isForwardSearching ? (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                ) : (
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                )}
                <input
                  type="text"
                  placeholder="Search people to forward..."
                  value={forwardSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForwardSearchQuery(val);
                    debouncedForwardSearchUsers(val);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 hover:bg-muted focus:bg-card border-transparent focus:border-indigo-500/50 rounded-2xl sm:text-sm text-base font-medium transition-all outline-none border focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 space-y-4 scrollbar-hide pb-20">
              {/* Existing Chats Section */}
              <div className="space-y-1">
                <div className="px-3 py-1 flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Recent Chats</h4>
                  <span className="text-[10px] font-bold text-indigo-500/60 bg-indigo-500/5 px-2 py-0.5 rounded-full">
                    {chats.filter(c => c.id !== selectedChat?.id).length} Active
                  </span>
                </div>
                {chats
                  .filter(chat => {
                    if (chat.id === selectedChat?.id) return false;
                    if (!forwardSearchQuery) return true;
                    const name = chat.other_user?.user_name?.toLowerCase() || '';
                    return name.includes(forwardSearchQuery.toLowerCase());
                  })
                  .map(chat => {
                    const isSelected = selectedChatsForForward.includes(chat.id);
                    return (
                      <button
                        key={chat.id}
                        onClick={() => toggleChatForForward(chat.id)}
                        className={`w-full p-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 group ${isSelected
                          ? 'bg-indigo-500/10'
                          : 'hover:bg-muted/50'
                          }`}
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 ${isSelected
                            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-card'
                            : 'group-hover:scale-105'
                            } ${chat.other_user?.user_avatar
                              ? 'bg-transparent'
                              : 'bg-indigo-50 text-indigo-600'
                            }`}>
                            {chat.other_user?.user_avatar ? (
                              <img src={chat.other_user.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              chat.other_user?.user_name?.charAt(0) || '?'
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-card shadow-lg animate-in zoom-in duration-200">
                              <Check size={10} className="text-white" strokeWidth={4} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <p className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-600' : 'text-foreground'}`}>
                            {chat.other_user?.user_name || 'System User'}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-tighter">
                            {chat.other_user?.user_type || 'User'}
                          </p>
                        </div>

                        {/* Selection Badge */}
                        {!isSelected && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-full">
                            Select
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Global Results Section */}
              {forwardSearchQuery.length >= 2 && (
                <div className="space-y-1">
                  <div className="px-3 py-1 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60">Other Results</h4>
                    {isForwardSearching && <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>}
                  </div>
                  {forwardSearchResults
                    .filter(user => {
                      // Don't show users who already have an active chat shown above
                      return !chats.some(c => c.other_user?.user_id === user.user_id);
                    })
                    .map(user => {
                      // Check if already selected by looking at the chats list (after auto-creating)
                      const existingChat = chats.find(c => c.other_user?.user_id === user.user_id);
                      const isSelected = existingChat ? selectedChatsForForward.includes(existingChat.id) : false;

                      return (
                        <button
                          key={`${user.user_id}_${user.user_type}`}
                          onClick={async () => {
                            if (existingChat) {
                              toggleChatForForward(existingChat.id);
                            } else {
                              // Auto-create chat
                              try {
                                const payload = {
                                  userId: user.user_id,
                                  userType: user.user_type,
                                  userName: user.user_name,
                                  userEmail: user.user_email || '',
                                  userAvatar: user.user_avatar || ''
                                };
                                const startRes = await chatApi.startChat(currentUser, payload);
                                await loadChats();
                                toggleChatForForward(startRes.chat.id);
                              } catch (err) {
                                console.error('Failed to auto-start chat for forward:', err);
                              }
                            }
                          }}
                          className={`w-full p-2.5 rounded-2xl transition-all duration-200 flex items-center gap-3 group ${isSelected
                            ? 'bg-indigo-500/10'
                            : 'hover:bg-muted/50'
                            }`}
                        >
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 ${user.user_type === 'doctor'
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-emerald-50 text-emerald-600'
                            } group-hover:scale-105`}>
                            {user.user_avatar ? (
                              <img src={user.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              user.user_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-bold text-sm truncate text-foreground">
                              {user.user_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-tighter">
                              {user.user_type === 'doctor' ? 'Provider' : 'Patient'}
                              {user.specialization && ` • ${user.specialization}`}
                            </p>
                          </div>
                          <div className="px-3 py-1 border border-border rounded-full text-[9px] font-black uppercase text-muted-foreground group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all">
                            New Chat
                          </div>
                        </button>
                      );
                    })}

                  {forwardSearchResults.length === 0 && !isForwardSearching && (
                    <div className="px-3 py-4 text-center rounded-2xl bg-muted/30 border border-dashed border-border/50">
                      <p className="text-[11px] font-bold text-muted-foreground/50 italic tracking-tight">No additional users found</p>
                    </div>
                  )}
                </div>
              )}

              {/* General Empty State */}
              {chats.filter(chat => {
                if (chat.id === selectedChat?.id) return false;
                if (!forwardSearchQuery) return true;
                const name = chat.other_user?.user_name?.toLowerCase() || '';
                return name.includes(forwardSearchQuery.toLowerCase());
              }).length === 0 && forwardSearchResults.length === 0 && !isForwardSearching && (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={28} className="text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground font-bold text-sm">No results found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try a different name</p>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t border-border/50 bg-card transition-all duration-300 ${selectedChatsForForward.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 h-0 p-0 pointer-events-none'
              }`}>
              <button
                onClick={handleForwardConfirm}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Send to {selectedChatsForForward.length} {selectedChatsForForward.length === 1 ? 'chat' : 'chats'}</span>
                    <Send size={16} />
                  </>
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

      {/* Image Full View Modal */}
      {previewMedia && previewMedia.type === 'image' && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="flex items-center justify-between p-4 md:p-6 text-white border-b border-white/10">
            <div className="min-w-0 flex-1 mr-4">
              <h3 className="text-sm md:text-lg font-black font-outfit tracking-tight truncate">{previewMedia.name}</h3>
              <p className="text-[8px] md:text-[10px] font-bold opacity-60 uppercase tracking-widest">Full Quality Preview</p>
            </div>
            <button
              onClick={() => setPreviewMedia(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <X size={20} className="md:w-6 md:h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={getMediaUrl(previewMedia.url)}
              alt={previewMedia.name}
              className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-2xl animate-in zoom-in duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-4 md:p-8 flex justify-center gap-3 md:gap-6">
            <a
              href={getMediaUrl(previewMedia.url)}
              download
              className="flex items-center gap-2 md:gap-2.5 px-4 md:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:scale-105"
            >
              <Download size={16} /> Download
            </a>
            <button
              onClick={() => window.open(getMediaUrl(previewMedia.url), '_blank')}
              className="flex items-center gap-2 md:gap-2.5 px-4 md:px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all"
            >
              <ExternalLink size={16} /> Open Original
            </button>
          </div>
        </div>
      )}

      {/* Half-Page File Preview (PDF/Doc) */}
      {previewMedia && previewMedia.type === 'file' && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-300" onClick={() => setPreviewMedia(null)}>
          <div
            className="w-full md:w-3/5 lg:w-1/2 bg-card h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black truncate max-w-[200px] md:max-w-md">{previewMedia.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={getMediaUrl(previewMedia.url)} download className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground" title="Download">
                  <Download size={18} />
                </a>
                <button onClick={() => setPreviewMedia(null)} className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-muted/30 relative overflow-hidden">
              <iframe
                src={getMediaUrl(previewMedia.url)}
                className="w-full h-full border-none"
                title="File Preview"
              />
            </div>
            <div className="p-4 border-t bg-card flex justify-between items-center">
              <p className="text-[10px] text-muted-foreground font-medium">Quick Preview Mode</p>
              <button
                onClick={() => window.open(getMediaUrl(previewMedia.url), '_blank')}
                className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline"
              >
                Open in Full Window
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
const ChatListItem = ({ chat, isSelected, onClick, isOnline, currentUser }) => {
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

  const renderLastMessage = () => {
    if (!chat.last_message) return 'Click to start chatting';
    if (chat.last_message.is_deleted) return 'Message was deleted';

    // Handle call messages
    if (chat.last_message.message_type === 'call') {
      const [type, direction, status] = chat.last_message.content.split('|');
      const isVideo = type === 'video';
      const isOwn = chat.last_message.sender_id === currentUser?.userId;

      // Determine viewer-relative direction
      const viewerDirection = isOwn ? direction : (direction === 'incoming' ? 'outgoing' : 'incoming');
      const isViewerIncoming = viewerDirection === 'incoming';

      switch (status) {
        case 'completed':
          return isVideo ? 'Video Call' : 'Audio Call';
        case 'missed':
        case 'not_answered':
          return isViewerIncoming ? 'Missed Call' : 'No Answer';
        case 'declined':
          return isViewerIncoming ? 'Call Declined' : 'Declined Call';
        default:
          return isVideo ? 'Video Call' : 'Audio Call';
      }
    }

    return chat.last_message.content;
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
              {renderLastMessage()}
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

// End of ChatTab component
export default ChatTab;

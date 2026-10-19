import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';

/**
 * WebRTC Video/Audio Call Component
 * Supports HD video (up to 4K) and high-quality audio
 */
const VideoCall = ({
  socket,
  currentUser,
  otherUser,
  isIncoming,
  callType, // 'video' or 'audio'
  incomingOffer, // The offer from incoming call
  onClose,
  onCallStatusChange // Callback to send call history message
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'calling'); // incoming, calling, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [, setCallStartTime] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const incomingOfferRef = useRef(incomingOffer);
  const hasLoggedStatus = useRef(false);

  // WebRTC Configuration with STUN/TURN servers
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  };

  // Media constraints for high quality
  const mediaConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000, // High quality audio
      channelCount: 2, // Stereo
    },
    video: callType === 'video' ? {
      width: { ideal: 3840, max: 3840 }, // 4K width
      height: { ideal: 2160, max: 2160 }, // 4K height
      frameRate: { ideal: 60, max: 60 }, // 60 FPS
      facingMode: 'user',
    } : false
  };

  // Initialize local media stream
  useEffect(() => {
    initializeMedia();

    return () => {
      cleanupCall();
    };
  }, []);

  // Setup WebRTC signaling listeners
  useEffect(() => {
    if (!socket?.socket) return;

    const handleCallAccepted = async (data) => {
      console.log('📞 Call accepted');
      setCallStatus('connected');
      startCallTimer();

      if (data.answer) {
        await peerConnectionRef.current?.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    };

    const handleCallRejected = () => {
      console.log('📞 Call rejected');
      // No log here - the rejector (receiver) logs it
      setCallStatus('ended');
      setTimeout(() => onClose(), 2000);
    };

    const handleCallEnded = () => {
      console.log('📞 Call ended by remote user');

      // Send call message
      if (onCallStatusChange && !hasLoggedStatus.current) {
        if (callStatus === 'incoming') {
          // If receiver sees call ended while status is incoming, it's a missed call
          console.log('📞 Missed call recorded by receiver');
          hasLoggedStatus.current = true;
          onCallStatusChange({
            type: callType,
            status: 'missed',
            duration: 0,
            isIncoming: true
          });
        }
        // Note: We don't log 'completed' here because the person who clicked 
        // 'End Call' is responsible for logging the completion.
      }

      setCallStatus('ended');
      setTimeout(() => onClose(), 2000);
    };

    const handleIceCandidate = async (data) => {
      console.log('🧊 Received ICE candidate');
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    };

    const handleCallOffer = async (data) => {
      console.log('📞 Received call offer');
      await handleIncomingOffer(data.offer);
    };

    socket.socket.on('call_accepted', handleCallAccepted);
    socket.socket.on('call_rejected', handleCallRejected);
    socket.socket.on('call_ended', handleCallEnded);
    socket.socket.on('ice_candidate', handleIceCandidate);
    socket.socket.on('call_offer', handleCallOffer);

    return () => {
      socket.socket.off('call_accepted', handleCallAccepted);
      socket.socket.off('call_rejected', handleCallRejected);
      socket.socket.off('call_ended', handleCallEnded);
      socket.socket.off('ice_candidate', handleIceCandidate);
      socket.socket.off('call_offer', handleCallOffer);
    };
  }, [socket?.socket, callStatus, callDuration, isIncoming, callType, onCallStatusChange]);

  // Handle call ringing timeout
  useEffect(() => {
    let timeoutId;
    if (callStatus === 'calling' || callStatus === 'incoming') {
      timeoutId = setTimeout(() => {
        console.log('📞 Call timed out (no answer)');

        if (socket?.socket) {
          if (callStatus === 'calling') {
            // Caller side timeout - tell receiver to stop ringing
            socket.socket.emit('end_call', {
              to: otherUser.user_id,
              toType: otherUser.user_type
            });
            // Note: We don't log 'not_answered' here anymore. 
            // The receiver will log 'missed' when they get 'end_call'.
          } else if (callStatus === 'incoming') {
            // Receiver side timeout - tell caller I'm not answering
            socket.socket.emit('reject_call', {
              to: otherUser.user_id,
              toType: otherUser.user_type
            });

            // Log missed call (Receiver's responsibility)
            if (onCallStatusChange && !hasLoggedStatus.current) {
              hasLoggedStatus.current = true;
              onCallStatusChange({
                type: callType,
                status: 'missed',
                duration: 0,
                isIncoming: true
              });
            }
          }
        }

        setCallStatus('ended');
        setTimeout(() => onClose(), 2000);
      }, 60000); // 60 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [callStatus, callType, onCallStatusChange, onClose, socket?.socket, otherUser]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      await setupPeerConnection(stream);

      if (!isIncoming) {
        await makeCall();
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
      onClose();
    }
  };

  const setupPeerConnection = async (stream) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🎥 Received remote track');
      const remoteStream = event.streams[0];
      setRemoteStream(remoteStream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket?.socket) {
        console.log('🧊 Sending ICE candidate');
        socket.socket.emit('ice_candidate', {
          to: otherUser.user_id,
          toType: otherUser.user_type,
          candidate: event.candidate
        });
      }
    };

    // Connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('connected');
        startCallTimer();
      } else if (peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed') {
        endCall();
      }
    };
  };

  const makeCall = async () => {
    try {
      console.log('📞 Making call...');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video'
      });

      await peerConnectionRef.current.setLocalDescription(offer);

      socket.socket.emit('call_user', {
        to: otherUser.user_id,
        toType: otherUser.user_type,
        from: currentUser.userId,
        fromType: currentUser.userType,
        fromName: currentUser.userName,
        callType: callType,
        offer: offer
      });
    } catch (error) {
      console.error('Error making call:', error);
      alert('Failed to initiate call');
      onClose();
    }
  };

  const handleIncomingOffer = async (offer) => {
    try {
      console.log('📞 Handling incoming offer...');
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log('✅ Remote description set');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const acceptCall = async () => {
    try {
      console.log('📞 Accepting call...');

      // Set the remote description from the incoming offer
      if (incomingOfferRef.current) {
        console.log('📞 Setting remote description from incoming offer');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(incomingOfferRef.current)
        );
      }

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      console.log('📞 Sending answer to caller');
      socket.socket.emit('accept_call', {
        to: otherUser.user_id,
        toType: otherUser.user_type,
        answer: answer
      });

      setCallStatus('connected');
      startCallTimer();
      console.log('✅ Call accepted and connected');
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call: ' + error.message);
    }
  };

  const rejectCall = () => {
    socket.socket.emit('reject_call', {
      to: otherUser.user_id,
      toType: otherUser.user_type
    });

    // Send call message - Declined (Rejector's responsibility)
    if (onCallStatusChange && !hasLoggedStatus.current) {
      hasLoggedStatus.current = true;
      onCallStatusChange({
        type: callType,
        status: 'declined',
        duration: 0,
        isIncoming: isIncoming
      });
    }

    onClose();
  };

  const endCall = () => {
    if (callStatus !== 'ended') {
      socket.socket.emit('end_call', {
        to: otherUser.user_id,
        toType: otherUser.user_type
      });
    }

    // Send call message with duration (Hangupper's responsibility)
    if (onCallStatusChange && callStatus === 'connected' && !hasLoggedStatus.current) {
      hasLoggedStatus.current = true;
      onCallStatusChange({
        type: callType,
        status: 'completed',
        duration: callDuration,
        isIncoming: isIncoming
      });
    }

    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => onClose(), 1000);
  };

  const cleanupCall = () => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());

    // Close peer connection
    peerConnectionRef.current?.close();

    // Stop timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
  };

  const startCallTimer = () => {
    setCallStartTime(Date.now());
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerEnabled;
      setIsSpeakerEnabled(!isSpeakerEnabled);
    }
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      remoteVideoRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullScreen(!isFullScreen);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0B] z-50 flex items-center justify-center overflow-hidden font-outfit">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {callType === 'video' ? (
          <div className="w-full h-full bg-black" />
        ) : (
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-rose-900/40 animate-pulse transition-all duration-[5000ms]" />
            <div className="absolute inset-0 backdrop-blur-[120px]" />
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      <div className="relative w-full h-full z-10 flex flex-col items-center justify-center">
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center">
            {/* Pulsing Avatar Container */}
            <div className="relative mb-12">
              {callStatus === 'connected' && (
                <>
                  <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 scale-150"></div>
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-10 scale-[2.5] animation-delay-700"></div>
                </>
              )}
              <div className="relative w-40 h-40 rounded-[3rem] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-0.5 shadow-2xl rotate-3 hover:rotate-0 transition-all duration-500">
                <div className="w-full h-full rounded-[2.8rem] bg-card flex items-center justify-center overflow-hidden border-4 border-white/10">
                  <span className="text-6xl text-indigo-600 font-black tracking-tighter uppercase">
                    {otherUser?.user_name?.charAt(0) || '?'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-black text-white mb-3 tracking-tight">
                {otherUser?.user_name}
              </h2>
              <div className="flex flex-col items-center gap-2">
                <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 ${callStatus === 'ended' ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white/5 border-white/10'
                  }`}>
                  {callStatus === 'calling' && (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  )}
                  <p className={`text-xs font-black uppercase tracking-[0.2em] ${callStatus === 'ended' ? 'text-rose-400' : 'text-indigo-200'
                    }`}>
                    {callStatus === 'incoming' && 'Incoming Call...'}
                    {callStatus === 'calling' && 'Calling...'}
                    {callStatus === 'connected' && formatDuration(callDuration)}
                    {callStatus === 'ended' && 'Call Ended'}
                  </p>
                </div>
                {callStatus === 'connected' && (
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                    Secure & Encrypted
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Local Video (PIP) */}
        {callType === 'video' && (
          <div className="absolute top-8 right-8 w-48 h-64 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/20 transform hover:scale-110 transition-all duration-500 group cursor-move">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <VideoOff size={32} className="text-slate-600" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">You</p>
            </div>
          </div>
        )}

        {/* Global Floating Controls Area */}
        <div className="absolute bottom-12 left-0 right-0 p-6 flex flex-col items-center gap-8 z-20">
          {/* Main Control Hub */}
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-[24px] p-2.5 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Toggle Audio */}
            <button
              onClick={toggleAudio}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${isAudioEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.4)] scale-110'
                }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? (
                <Mic size={22} className="group-hover:scale-110 transition-transform" />
              ) : (
                <MicOff size={22} />
              )}
            </button>

            {/* Toggle Video (If video call) */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${isVideoEnabled
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.4)] scale-110'
                  }`}
                title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
              >
                {isVideoEnabled ? (
                  <Video size={22} className="group-hover:scale-110 transition-transform" />
                ) : (
                  <VideoOff size={22} />
                )}
              </button>
            )}

            {/* Speaker/Volume */}
            <button
              onClick={toggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group ${isSpeakerEnabled
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
            >
              {isSpeakerEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>

            {/* End Call Button */}
            {(callStatus === 'connected' || callStatus === 'calling') && (
              <button
                onClick={endCall}
                className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(225,29,72,0.4)] hover:bg-rose-700 transition-all transform hover:scale-110 hover:-rotate-12 active:scale-95 group"
                title="End Call"
              >
                <PhoneOff size={28} fill="currentColor" className="group-hover:rotate-12 transition-transform" />
              </button>
            )}

            {/* Screen Actions for Video */}
            {callType === 'video' && (
              <button
                onClick={toggleFullScreen}
                className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"
              >
                {isFullScreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
              </button>
            )}
          </div>

          {/* Incoming Call Response Area */}
          {callStatus === 'incoming' && (
            <div className="flex items-center gap-8 animate-in zoom-in-95 fade-in duration-500">
              <div className="flex flex-col items-center gap-3 group">
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 bg-rose-600/20 backdrop-blur-xl text-rose-600 border border-rose-600/20 rounded-[2rem] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 active:scale-90 shadow-xl"
                >
                  <PhoneOff size={28} fill="currentColor" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/80">Decline</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <button
                  onClick={acceptCall}
                  className="w-20 h-20 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center hover:bg-emerald-500 transition-all transform hover:scale-110 active:scale-90 shadow-[0_20px_40px_-5px_rgba(16,185,129,0.4)] animate-bounce"
                >
                  <Phone size={32} fill="currentColor" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Accept Call</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
};

export default VideoCall;

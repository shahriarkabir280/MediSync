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
  chatId, // Chat ID to send call messages
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
  const [callStartTime, setCallStartTime] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callTimerRef = useRef(null);
  const incomingOfferRef = useRef(incomingOffer);

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
      
      // Send call message - Rejected/Not answered
      if (onCallStatusChange && callStatus === 'calling') {
        onCallStatusChange({
          type: callType,
          status: 'not_answered',
          duration: 0,
          isIncoming: false
        });
      }
      
      setCallStatus('ended');
      setTimeout(() => onClose(), 2000);
    };

    const handleCallEnded = () => {
      console.log('📞 Call ended by remote user');
      
      // Send call message with duration if connected
      if (onCallStatusChange && callStatus === 'connected') {
        onCallStatusChange({
          type: callType,
          status: 'completed',
          duration: callDuration,
          isIncoming: isIncoming
        });
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
  }, [socket?.socket]);

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
    
    // Send call message - Declined
    if (onCallStatusChange) {
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
    
    // Send call message with duration
    if (onCallStatusChange && callStatus === 'connected') {
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
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Remote Video (Main) */}
      <div className="relative w-full h-full">
        {callType === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-5xl text-white font-bold">
                  {otherUser?.user_name?.charAt(0) || '?'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {otherUser?.user_name}
              </h2>
              <p className="text-white text-lg">
                {callStatus === 'incoming' && 'Incoming audio call...'}
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'connected' && formatDuration(callDuration)}
                {callStatus === 'ended' && 'Call ended'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callType === 'video' && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <VideoOff size={32} className="text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Call Status */}
        {callType === 'video' && callStatus === 'connected' && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
            <p className="text-white font-semibold">{formatDuration(callDuration)}</p>
          </div>
        )}

        {/* Call Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center space-x-4">
            {/* Toggle Audio */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute' : 'Unmute'}
            >
              {isAudioEnabled ? (
                <Mic size={24} className="text-white" />
              ) : (
                <MicOff size={24} className="text-white" />
              )}
            </button>

            {/* Toggle Video */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
                  isVideoEnabled
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoEnabled ? (
                  <Video size={24} className="text-white" />
                ) : (
                  <VideoOff size={24} className="text-white" />
                )}
              </button>
            )}

            {/* End Call */}
            {callStatus === 'connected' || callStatus === 'calling' ? (
              <button
                onClick={endCall}
                className="p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-lg transform hover:scale-110"
                title="End call"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            ) : null}

            {/* Toggle Speaker */}
            <button
              onClick={toggleSpeaker}
              className={`p-4 rounded-full transition-all duration-200 shadow-lg ${
                isSpeakerEnabled
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isSpeakerEnabled ? 'Mute speaker' : 'Unmute speaker'}
            >
              {isSpeakerEnabled ? (
                <Volume2 size={24} className="text-white" />
              ) : (
                <VolumeX size={24} className="text-white" />
              )}
            </button>

            {/* Full Screen */}
            {callType === 'video' && (
              <button
                onClick={toggleFullScreen}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200 shadow-lg"
                title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullScreen ? (
                  <Minimize2 size={24} className="text-white" />
                ) : (
                  <Maximize2 size={24} className="text-white" />
                )}
              </button>
            )}
          </div>

          {/* Incoming Call Actions */}
          {callStatus === 'incoming' && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <button
                onClick={rejectCall}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <PhoneOff size={20} className="text-white" />
                <span className="text-white font-semibold">Decline</span>
              </button>
              <button
                onClick={acceptCall}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-full transition-all duration-200 shadow-lg flex items-center space-x-2 animate-pulse"
              >
                <Phone size={20} className="text-white" />
                <span className="text-white font-semibold">Accept</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default VideoCall;

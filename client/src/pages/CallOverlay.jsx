import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Monitor } from 'lucide-react';
import './CallOverlay.css';

export const CallOverlay = ({ socket, teamId, channelId, channelName, currentUser, initialCallType, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // Keyed by socketId: { socketId, userName, avatarColor, stream }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialCallType === 'voice');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareOwner, setScreenShareOwner] = useState(null); // { socketId, name }
  const [errorMsg, setErrorMsg] = useState('');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const localVideoRef = useRef(null);
  const pcs = useRef({}); // RTCPeerConnection instances keyed by socketId
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const originalVideoTrackRef = useRef(null);

  // Configuration for RTCPeerConnection (public Google STUN servers)
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    // 1. Get user media (microphone + webcam)
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        streamRef.current = stream;
        
        if (initialCallType === 'voice') {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) videoTrack.enabled = false;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Connect WebRTC signaling once stream is ready
        initWebRTC();
      } catch (err) {
        console.error('Failed to get media devices:', err);
        setErrorMsg('Microphone or Webcam access denied. Call will be audio-only or screen share.');
        
        // Try audio-only fallback
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          setLocalStream(audioStream);
          streamRef.current = audioStream;
          initWebRTC();
        } catch (audioErr) {
          console.error('Failed fallback to audio-only:', audioErr);
          setErrorMsg('Could not access microphone or camera. Please check browser permissions.');
        }
      }
    };

    initMedia();

    return () => {
      // Clean up local media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clean up peer connections
      Object.keys(pcs.current).forEach(id => {
        pcs.current[id].close();
      });
      pcs.current = {};
      
      // Notify signaling server
      if (socket) {
        socket.emit('leave_call_room', { teamId, channelId });
      }
    };
  }, []);

  // Bind local stream to local video element ref
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff, isScreenSharing]);

  const initWebRTC = () => {
    if (!socket) return;

    // Join the call signaling room
    socket.emit('join_call_room', {
      teamId,
      channelId,
      userName: currentUser.name,
      userAvatarColor: currentUser.avatarColor,
      userAvatarUrl: currentUser.avatarUrl
    });

    // Receive other participant socket IDs already in call
    socket.on('call_room_users', (users) => {
      // Newly joined user: Wait for offers from existing users
      console.log('Call room users received:', users);
    });

    // Existing user: Receive new joiner notice and initiate offer
    socket.on('user_joined_call', async ({ socketId, userName, userAvatarColor, userAvatarUrl }) => {
      console.log('User joined call:', userName, socketId);
      const pc = createPeerConnection(socketId, userName, userAvatarColor);
      
      // Add local stream tracks to PC
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current);
        });
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('send_call_signal', {
          targetSocketId: socketId,
          senderName: currentUser.name,
          senderAvatarColor: currentUser.avatarColor,
          signal: { type: 'offer', sdp: pc.localDescription }
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    // Handle incoming offer, answer or ice candidate signals
    socket.on('receive_call_signal', async ({ senderSocketId, senderName, senderAvatarColor, signal }) => {
      const pc = pcs.current[senderSocketId] || createPeerConnection(senderSocketId, senderName, senderAvatarColor);

      // Dynamically upgrade Guest to real username if received
      if (senderName) {
        setRemoteStreams(prev => {
          if (prev[senderSocketId] && (prev[senderSocketId].userName === 'Guest' || prev[senderSocketId].userName !== senderName)) {
            return {
              ...prev,
              [senderSocketId]: {
                ...prev[senderSocketId],
                userName: senderName,
                avatarColor: senderAvatarColor || prev[senderSocketId].avatarColor
              }
            };
          }
          return prev;
        });
      }

      if (signal.type === 'offer') {
        // Add tracks if not added already
        if (pc.getSenders().length === 0 && streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, streamRef.current);
          });
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        // Process queued ice candidates
        if (pc.iceQueue) {
          for (const cand of pc.iceQueue) {
            await pc.addIceCandidate(cand).catch(err => console.error('Error adding queued ICE candidate:', err));
          }
          pc.iceQueue = [];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('send_call_signal', {
          targetSocketId: senderSocketId,
          senderName: currentUser.name,
          senderAvatarColor: currentUser.avatarColor,
          signal: { type: 'answer', sdp: pc.localDescription }
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        // Process queued ice candidates
        if (pc.iceQueue) {
          for (const cand of pc.iceQueue) {
            await pc.addIceCandidate(cand).catch(err => console.error('Error adding queued ICE candidate:', err));
          }
          pc.iceQueue = [];
        }
      } else if (signal.candidate) {
        try {
          const candidateObj = new RTCIceCandidate(signal.candidate);
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidateObj);
          } else {
            if (!pc.iceQueue) pc.iceQueue = [];
            pc.iceQueue.push(candidateObj);
          }
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    socket.on('user_left_call', ({ socketId }) => {
      console.log('User left call:', socketId);
      if (pcs.current[socketId]) {
        pcs.current[socketId].close();
        delete pcs.current[socketId];
      }
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
      setScreenShareOwner(prev => (prev && prev.socketId === socketId ? null : prev));
    });

    socket.on('screen_share_owner', ({ ownerSocketId, ownerName }) => {
      setScreenShareOwner({ socketId: ownerSocketId, name: ownerName });
    });

    socket.on('screen_share_cleared', () => {
      setScreenShareOwner(null);
    });
  };

  const createPeerConnection = (socketId, userName = 'Guest', avatarColor = '#8b5cf6') => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcs.current[socketId] = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('send_call_signal', {
          targetSocketId: socketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from:', socketId, event.streams[0]);
      setRemoteStreams(prev => ({
        ...prev,
        [socketId]: {
          socketId,
          userName,
          avatarColor,
          stream: event.streams[0]
        }
      }));
    };

    return pc;
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera Video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Save original camera track
        if (streamRef.current) {
          const originalTrack = streamRef.current.getVideoTracks()[0];
          originalVideoTrackRef.current = originalTrack;
        }

        // Replace local video element source
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace video track for all active peer connections
        Object.values(pcs.current).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        // Notify other participants via server
        if (socket) {
          socket.emit('share_screen_started', {
            teamId,
            channelId,
            userName: currentUser.name
          });
        }

        setIsScreenSharing(true);
        setIsVideoOff(false); // Make sure video box is on

        // Listen for browser native "Stop Sharing" bubble click
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    const cameraTrack = originalVideoTrackRef.current || (streamRef.current && streamRef.current.getVideoTracks()[0]);

    if (cameraTrack) {
      // Restore camera track for all active peer connections
      Object.values(pcs.current).forEach(pc => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(cameraTrack);
        }
      });
    }

    // Restore local video element source
    if (localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }

    // Notify other participants via server
    if (socket) {
      socket.emit('share_screen_stopped', { teamId, channelId });
    }

    setIsScreenSharing(false);
  };

  const remoteUsers = Object.values(remoteStreams);

  return (
    <div className="call-overlay-viewport">
      <div className="call-header">
        <div className="call-header-title">
          <span className="live-badge">LIVE</span>
          <span className="call-duration-badge">{formatDuration(duration)}</span>
          <h2>Channel Meeting: #{channelName}</h2>
        </div>
        <div className="call-participants-counter">
          <Users size={16} />
          <span>{remoteUsers.length + 1} participant(s)</span>
        </div>
      </div>

      {errorMsg && <div className="call-error-banner">{errorMsg}</div>}

      {/* Screen Sharing Banner Notification */}
      {screenShareOwner && (
        <div 
          className="screen-share-banner animate-fade"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '10px 16px',
            borderRadius: '8px',
            color: '#a7f3d0',
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: '600'
          }}
        >
          <Monitor size={16} />
          <span>{screenShareOwner.socketId === socket?.id ? 'You are sharing your screen' : `${screenShareOwner.userName || screenShareOwner.name} is currently sharing their screen`}</span>
        </div>
      )}

      {/* Main Grid View */}
      <div className={`call-grid ${remoteUsers.length === 0 ? 'single-view' : 'multi-view'}`}>
        
        {/* Local Participant Feed */}
        <div 
          className="video-card local-feed"
          style={isScreenSharing ? { border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' } : {}}
        >
          {isVideoOff ? (
            <div className="call-avatar-placeholder" style={{ backgroundColor: currentUser.avatarColor || '#8b5cf6' }}>
              {(currentUser.name || 'U').charAt(0).toUpperCase()}
            </div>
          ) : (
            <video ref={localVideoRef} autoPlay playsInline muted className="video-element" />
          )}
          <span className="video-label">{currentUser.name} (You) {isScreenSharing && ' - Screen sharing'}</span>
        </div>

        {/* Remote Participant Feeds */}
        {remoteUsers.map((user, idx) => (
          <VideoFeedCard 
            key={idx} 
            user={user} 
            isFeatured={screenShareOwner && screenShareOwner.socketId === user.socketId} 
          />
        ))}
      </div>

      {/* Control Action Toolbar */}
      <div className="call-controls-bar glass-panel">
        <button 
          onClick={toggleMute} 
          className={`control-btn ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button 
          onClick={toggleVideo} 
          className={`control-btn ${isVideoOff ? 'camera-off' : ''}`}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button 
          onClick={toggleScreenShare} 
          disabled={screenShareOwner && screenShareOwner.socketId !== socket?.id}
          className={`control-btn ${isScreenSharing ? 'screen-sharing' : ''}`}
          style={
            isScreenSharing ? { background: '#10b981', color: 'white', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' } :
            (screenShareOwner && screenShareOwner.socketId !== socket?.id) ? { opacity: 0.3, cursor: 'not-allowed' } : {}
          }
          title={
            isScreenSharing ? 'Stop Screen Share' : 
            (screenShareOwner && screenShareOwner.socketId !== socket?.id) ? `${screenShareOwner.userName || screenShareOwner.name} is already sharing screen` : 
            'Share Screen'
          }
        >
          <Monitor size={20} />
        </button>

        <button 
          onClick={onClose} 
          className="control-btn hang-up"
          title="Leave Call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
};

// Sub-component to bind srcObject properly inside remote stream feeds
const VideoFeedCard = ({ user, isFeatured }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && user.stream) {
      videoRef.current.srcObject = user.stream;
    }
  }, [user.stream]);

  const hasVideoTrack = user.stream && user.stream.getVideoTracks().length > 0 && user.stream.getVideoTracks()[0].enabled;

  return (
    <div 
      className="video-card remote-feed"
      style={isFeatured ? { border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' } : {}}
    >
      {!hasVideoTrack ? (
        <div className="call-avatar-placeholder" style={{ backgroundColor: user.avatarColor }}>
          {(user.userName || 'U').charAt(0).toUpperCase()}
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="video-element" />
      )}
      <span className="video-label">{user.userName} {isFeatured && ' - Screen sharing'}</span>
    </div>
  );
};

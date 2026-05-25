import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Monitor, Minimize2, Maximize2, Smile } from 'lucide-react';
import './CallOverlay.css';

export const CallOverlay = ({ socket, teamId, channelId, channelName, currentUser, initialCallType, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // Keyed by socketId: { socketId, userName, avatarColor, stream }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareOwner, setScreenShareOwner] = useState(null); // { socketId, name }
  const [errorMsg, setErrorMsg] = useState('');
  const [duration, setDuration] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [showReactionsPopup, setShowReactionsPopup] = useState(false);

  const triggerFloatingReaction = (emoji) => {
    const id = Math.random().toString(36).substr(2, 9);
    const left = Math.random() * 80 + 10;
    const duration = Math.random() * 1.5 + 2;
    const rotation = Math.random() * 60 - 30;
    
    setReactions(prev => [...prev, { id, emoji, left, duration, rotation }]);
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);
  };

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('send_call_reaction', { teamId, channelId, emoji });
    }
    triggerFloatingReaction(emoji);
  };

  // Floating Minimized Panel states
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 320 - 20, y: window.innerHeight - 260 - 20 });
  const draggingRef = useRef(false);
  const relRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isMinimized) return;
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(window.innerWidth - 320 - 20, prev.x),
        y: Math.min(window.innerHeight - 260 - 20, prev.y)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  const handleMouseDown = (e) => {
    if (!isMinimized) return;
    if (e.target.closest('button') || e.target.closest('svg')) return;
    
    draggingRef.current = true;
    relRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current) return;
      
      let newX = e.clientX - relRef.current.x;
      let newY = e.clientY - relRef.current.y;
      
      const cardWidth = 320;
      const cardHeight = 260;
      
      newX = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, newX));
      newY = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, newY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
    };

    if (isMinimized) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMinimized]);

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

  // Configuration for RTCPeerConnection (public Google STUN + Metered Open Relay STUN/TURN)
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.nextcloud.com:443' },
      { urls: 'stun:openrelay.metered.ca:80' },
      { urls: 'stun:global.relay.metered.ca:80' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
          'turn:global.relay.metered.ca:80',
          'turn:global.relay.metered.ca:443',
          'turn:global.relay.metered.ca:443?transport=tcp'
        ],
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10
  };

  useEffect(() => {
    // 1. Get user media (microphone + webcam)
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 15, max: 24 }
          },
          audio: true
        });
        setLocalStream(stream);
        streamRef.current = stream;

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
      
      // Notify signaling server and clean up socket listeners
      if (socket) {
        socket.emit('leave_call_room', { teamId, channelId });
        socket.off('call_room_users');
        socket.off('user_joined_call');
        socket.off('receive_call_signal');
        socket.off('user_left_call');
        socket.off('screen_share_owner');
        socket.off('screen_share_cleared');
        socket.off('receive_call_reaction');
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
      userId: currentUser.id,
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
      addLocalTracksToPeer(pc);

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
        if (pc.getSenders().length === 0) {
          addLocalTracksToPeer(pc);
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
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else {
          console.warn('Ignore setting remote answer SDP because signalingState is already stable.');
        }
        
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

    socket.on('receive_call_reaction', ({ emoji }) => {
      triggerFloatingReaction(emoji);
    });
  };

  const triggerIceRestart = async (socketId) => {
    const pc = pcs.current[socketId];
    if (!pc) return;
    try {
      console.log(`Initiating ICE restart for peer connection ${socketId}`);
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit('send_call_signal', {
        targetSocketId: socketId,
        senderName: currentUser.name,
        senderAvatarColor: currentUser.avatarColor,
        signal: { type: 'offer', sdp: pc.localDescription }
      });
    } catch (err) {
      console.error(`Error during ICE restart with ${socketId}:`, err);
    }
  };

  const addLocalTracksToPeer = (pc) => {
    // Determine the active video track (webcam or screen share)
    const activeVideoTrack = screenStreamRef.current ? screenStreamRef.current.getVideoTracks()[0] : (streamRef.current && streamRef.current.getVideoTracks()[0]);
    const activeAudioTrack = streamRef.current && streamRef.current.getAudioTracks()[0];
    const videoStream = screenStreamRef.current || streamRef.current;
    
    // Clear existing senders to prevent duplicate tracks
    const senders = pc.getSenders();
    senders.forEach(sender => pc.removeTrack(sender));
    
    if (activeAudioTrack && streamRef.current) {
      pc.addTrack(activeAudioTrack, streamRef.current);
    }
    if (activeVideoTrack && videoStream) {
      pc.addTrack(activeVideoTrack, videoStream);
    }
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

    pc.onnegotiationneeded = async () => {
      if (pc.signalingState !== 'stable') return;
      try {
        console.log(`Negotiation needed with ${userName} (${socketId})...`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('send_call_signal', {
          targetSocketId: socketId,
          senderName: currentUser.name,
          senderAvatarColor: currentUser.avatarColor,
          signal: { type: 'offer', sdp: pc.localDescription }
        });
      } catch (err) {
        console.error('Error during renegotiation offer creation:', err);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from:', socketId, event.track.kind);
      setRemoteStreams(prev => {
        const existing = prev[socketId];
        let streamToUse;
        if (existing && existing.stream) {
          const tracks = existing.stream.getTracks();
          if (!tracks.some(t => t.id === event.track.id)) {
            tracks.push(event.track);
          }
          streamToUse = new MediaStream(tracks);
        } else {
          streamToUse = event.streams[0] || new MediaStream([event.track]);
        }
        return {
          ...prev,
          [socketId]: {
            socketId,
            userName,
            avatarColor,
            stream: streamToUse
          }
        };
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State with ${userName} (${socketId}):`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.log(`ICE failed/disconnected with ${userName}. Triggering ICE restart...`);
        triggerIceRestart(socketId);
      }
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

        // Re-add tracks for all active peer connections to trigger renegotiation
        Object.values(pcs.current).forEach(pc => {
          addLocalTracksToPeer(pc);
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

    // Re-add camera tracks for all active peer connections to trigger renegotiation
    Object.values(pcs.current).forEach(pc => {
      addLocalTracksToPeer(pc);
    });

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

  const getMinimizedUserToRender = () => {
    if (screenShareOwner && screenShareOwner.socketId !== socket?.id) {
      return remoteUsers.find(u => u.socketId === screenShareOwner.socketId);
    }
    return null;
  };
  const minimizedRemoteUser = getMinimizedUserToRender();

  return (
    <div 
      className={`call-overlay-viewport ${isMinimized ? 'minimized' : ''}`}
      style={isMinimized ? { left: `${position.x}px`, top: `${position.y}px` } : {}}
      onMouseDown={handleMouseDown}
    >
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
        <div className="call-header-actions" style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button 
            type="button"
            onClick={() => setIsMinimized(!isMinimized)} 
            className="header-action-btn"
            title={isMinimized ? "Maximize Call" : "Minimize Call"}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s',
              zIndex: 100008
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
      </div>

      {errorMsg && !isMinimized && <div className="call-error-banner">{errorMsg}</div>}

      {/* Screen Sharing Banner Notification */}
      {screenShareOwner && !isMinimized && (
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
      {isMinimized ? (
        <div className="call-grid single-view">
          {minimizedRemoteUser ? (
            <VideoFeedCard user={minimizedRemoteUser} isFeatured={true} />
          ) : (
            <div 
              className="video-card local-feed"
              style={isScreenSharing ? { border: '2px solid #10b981', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' } : {}}
            >
              {isVideoOff ? (
                <div className="call-avatar-placeholder" style={{ backgroundColor: currentUser.avatarColor || '#8b5cf6' }}>
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
              ) : (
                <video 
                  ref={el => {
                    localVideoRef.current = el;
                    if (el) {
                      const expectedStream = screenStreamRef.current || localStream;
                      if (el.srcObject !== expectedStream) {
                        el.srcObject = expectedStream;
                      }
                    }
                  }} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="video-element" 
                />
              )}
              <span className="video-label">{currentUser.name} (You)</span>
            </div>
          )}
        </div>
      ) : (
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
              <video 
                ref={el => {
                  localVideoRef.current = el;
                  if (el) {
                    const expectedStream = screenStreamRef.current || localStream;
                    if (el.srcObject !== expectedStream) {
                      el.srcObject = expectedStream;
                    }
                  }
                }} 
                autoPlay 
                playsInline 
                muted 
                className="video-element" 
              />
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
      )}

      {/* Floating Call Reactions Animation Overlay */}
      <div className="floating-reactions-container" style={{
        position: 'absolute',
        bottom: '100px',
        left: 0,
        right: 0,
        height: '60%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {reactions.map(r => (
          <div 
            key={r.id} 
            className="floating-emoji" 
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: `${r.left}%`,
              fontSize: '32px',
              animation: `floatUp ${r.duration}s ease-out forwards`,
              transform: `rotate(${r.rotation}deg)`,
              opacity: 0.9
            }}
          >
            {r.emoji}
          </div>
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

        {/* Zoom/Teams style reactions button */}
        <button 
          onClick={() => setShowReactionsPopup(!showReactionsPopup)} 
          className={`control-btn ${showReactionsPopup ? 'active' : ''}`}
          title="Send Reaction"
          style={{ position: 'relative' }}
        >
          <Smile size={20} />
          {showReactionsPopup && (
            <div className="reactions-popup glass-panel" style={{
              position: 'absolute',
              bottom: '56px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 17, 26, 0.95)',
              border: '1px solid var(--border-light)',
              borderRadius: '24px',
              padding: '6px 12px',
              display: 'flex',
              gap: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 100010
            }}>
              {['👍', '❤️', '👏', '😂', '🎉'].map(emoji => (
                <span 
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    sendReaction(emoji);
                    setShowReactionsPopup(false);
                  }}
                  style={{
                    fontSize: '22px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    padding: '2px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </span>
              ))}
            </div>
          )}
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
      {!hasVideoTrack && (
        <div className="call-avatar-placeholder" style={{ backgroundColor: user.avatarColor || '#8b5cf6', zIndex: 2 }}>
          {(user.userName || 'U').charAt(0).toUpperCase()}
        </div>
      )}
      <video 
        ref={el => {
          videoRef.current = el;
          if (el && user.stream) {
            if (el.srcObject !== user.stream) {
              el.srcObject = user.stream;
            }
          }
        }} 
        autoPlay 
        playsInline 
        className="video-element" 
        style={{ 
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          objectFit: 'cover',
          zIndex: 1,
          opacity: hasVideoTrack ? 1 : 0,
          pointerEvents: hasVideoTrack ? 'auto' : 'none'
        }} 
      />
      <span className="video-label" style={{ zIndex: 3 }}>{user.userName} {isFeatured && ' - Screen sharing'}</span>
    </div>
  );
};

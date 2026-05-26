import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../context/TeamContext';
import { 
  Bell, MessageSquare, Users, Phone, FileText, Settings, LogOut, 
  Search, Plus, ChevronDown, Check, User, Sparkles, Shield, Hash, 
  ArrowUpRight, TrendingUp, Calendar, Copy, Eye, EyeOff, X, Send,
  Paperclip, Smile, Users as GroupIcon, ShieldAlert, Key, ClipboardCheck,
  Download, File as FileIcon, Menu, Mic, Camera, Code, RefreshCw, Trash2
} from 'lucide-react';

import { CallOverlay } from './CallOverlay';

// Simple regex-based code syntax highlighting function
const highlightCode = (code, language) => {
  if (!code) return '';
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'javascript' || language === 'typescript') {
    escaped = escaped
      .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
      .replace(/(["'`])(.*?)\1/g, '<span class="code-string">$1$2$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|class|extends|new|async|await|try|catch|finally|this)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/\b(true|false|null|undefined|NaN|[0-9]+)\b/g, '<span class="code-number">$1</span>');
  } else if (language === 'python') {
    escaped = escaped
      .replace(/(#.*)/g, '<span class="code-comment">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="code-string">$1$2$1</span>')
      .replace(/\b(def|return|if|elif|else|for|while|import|from|class|try|except|finally|in|is|not|and|or|lambda|pass)\b/g, '<span class="code-keyword">$1</span>')
      .replace(/\b(True|False|None|[0-9]+)\b/g, '<span class="code-number">$1</span>');
  } else if (language === 'html' || language === 'css') {
    escaped = escaped
      .replace(/(&lt;\/?[a-zA-Z0-9:-]+&gt;)/g, '<span class="code-keyword">$1</span>')
      .replace(/([a-zA-Z:-]+)=/g, '<span class="code-attribute">$1</span>=')
      .replace(/([a-zA-Z-]+)\s*:/g, '<span class="code-keyword">$1</span>:');
  } else if (language === 'sql') {
    escaped = escaped
      .replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|ON|GROUP|BY|ORDER|HAVING|CREATE|TABLE|ALTER|DROP|VALUES|AND|OR|NOT|NULL)\b/gi, '<span class="code-keyword">$1</span>')
      .replace(/(--.*)/g, '<span class="code-comment">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="code-string">$1$2$1</span>');
  }
  return escaped;
};

const CodeSnippetBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = highlightCode(code, language);
  const lineNumbers = code.split('\n').map((_, i) => i + 1);

  return (
    <div className="code-snippet-box" style={{
      background: '#090a0f',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '6px',
      width: '100%',
      maxWidth: '680px',
      fontFamily: 'Consolas, Monaco, monospace'
    }}>
      <style>{`
        .code-snippet-box .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12px;
          color: var(--text-secondary);
        }
        .code-snippet-box .code-body-wrapper {
          display: flex;
          padding: 12px;
          font-size: 13px;
          line-height: 1.5;
          overflow-x: auto;
        }
        .code-snippet-box .line-numbers {
          color: rgba(255, 255, 255, 0.25);
          text-align: right;
          padding-right: 12px;
          user-select: none;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }
        .code-snippet-box .code-content {
          padding-left: 12px;
          color: #e2e8f0;
          white-space: pre;
          flex-grow: 1;
        }
        .code-snippet-box .code-keyword { color: #f43f5e; font-weight: 600; }
        .code-snippet-box .code-string { color: #10b981; }
        .code-snippet-box .code-comment { color: #64748b; font-style: italic; }
        .code-snippet-box .code-number { color: #3b82f6; }
        .code-snippet-box .code-attribute { color: #eab308; }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
      <div className="code-header">
        <span style={{ textTransform: 'uppercase', fontWeight: 600, fontSize: '11px', color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
          {language}
        </span>
        <button 
          type="button"
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: 'white',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div className="code-body-wrapper">
        <div className="line-numbers">
          {lineNumbers.map(n => <div key={n}>{n}</div>)}
        </div>
        <pre className="code-content" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </div>
    </div>
  );
};

// Touch Swipe gesture component to slide-to-reply on mobile
const MessageSwipeRow = ({ msg, onReply, children }) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  if (msg.isSystem) {
    return children;
  }

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diffX = e.touches[0].clientX - startX;
    if (diffX > 0) {
      setCurrentX(Math.min(60, diffX));
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (currentX >= 40) {
      onReply();
    }
    setCurrentX(0);
  };

  const translateStyle = currentX > 0 ? {
    transform: `translateX(${currentX}px)`,
    transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  } : {
    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  return (
    <div 
      className="swipe-reply-wrapper" 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', width: '100%' }}
    >
      {currentX > 15 && (
        <div style={{
          position: 'absolute',
          left: `${Math.min(20, currentX - 20)}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)',
          opacity: Math.min(1, (currentX - 15) / 25),
          zIndex: 1,
          pointerEvents: 'none'
        }}>
          <MessageSquare size={16} style={{ transform: 'scaleX(-1)' }} />
        </div>
      )}
      <div style={translateStyle}>
        {children}
      </div>
    </div>
  );
};

const Teams = () => {
  const { user, token, logout } = useAuth();
  const { 
    teams, 
    currentTeam, 
    currentChannel, 
    loadingTeams, 
    createNewTeam, 
    joinExistingTeam, 
    createChannel,
    setCurrentTeam, 
    setCurrentChannel,
    messages,
    sendMessage,
    deleteMessage,
    members,
    leaveTeam,
    socket,
  } = useTeams();

  const themeColors = {
    default: {
      '--accent-primary': '#6366f1',
      '--accent-secondary': '#8b5cf6',
      '--accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c084fc 100%)',
    },
    lavender: {
      '--accent-primary': '#a855f7',
      '--accent-secondary': '#c084fc',
      '--accent-gradient': 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e879f9 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #9333ea 0%, #a855f7 50%, #d946ef 100%)',
    },
    emerald: {
      '--accent-primary': '#10b981',
      '--accent-secondary': '#34d399',
      '--accent-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 50%, #34d399 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #059669 0%, #047857 50%, #10b981 100%)',
    },
    sunset: {
      '--accent-primary': '#f97316',
      '--accent-secondary': '#f43f5e',
      '--accent-gradient': 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #f43f5e 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #ea580c 0%, #db2777 50%, #e11d48 100%)',
    },
    midnight: {
      '--accent-primary': '#0ea5e9',
      '--accent-secondary': '#2563eb',
      '--accent-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #2563eb 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #1d4ed8 100%)',
    },
    crimson: {
      '--accent-primary': '#ef4444',
      '--accent-secondary': '#dc2626',
      '--accent-gradient': 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
      '--accent-gradient-hover': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #7f1d1d 100%)',
    }
  };

  const selectedTheme = currentTeam?.theme || 'default';
  const activeStyle = themeColors[selectedTheme] || themeColors.default;

  const admins = currentTeam?.admins || (currentTeam ? [currentTeam.creatorId] : []);
  const currentUserIsAdmin = currentTeam && user ? admins.includes(user.id) : false;

  const [activeTab, setActiveTab] = useState('teams');
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState('video'); // 'voice' or 'video'
  const [incomingCallAlert, setIncomingCallAlert] = useState(null); // { teamId, channelId, channelName, userName, callType }
  const [activeCalls, setActiveCalls] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false); // Create/Join Team modal
  const [modalTab, setModalTab] = useState('create'); // 'create' or 'join'
  
  // Custom states for small features
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamEditName, setTeamEditName] = useState('');
  const [teamEditAvatarColor, setTeamEditAvatarColor] = useState('');
  const [teamEditAvatarUrl, setTeamEditAvatarUrl] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // GIF & Sticker states
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPickerTab, setMediaPickerTab] = useState('gifs'); // 'gifs' or 'stickers'
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [searchedGifs, setSearchedGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Form states - Team
  const [teamName, setTeamName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');

  // Code Snippet & AI states
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [aiTyping, setAiTyping] = useState(false);

  useEffect(() => {
    setAiTyping(false);
  }, [currentChannel]);

  // Form states - Channel
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Form states - Profile
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatarColor, setProfileAvatarColor] = useState('');
  const [profileStatusMsg, setProfileStatusMsg] = useState('');
  const [profileOnlineStatus, setProfileOnlineStatus] = useState('online');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileJobTitle, setProfileJobTitle] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  
  // Custom Avatar Cropping States
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [replyToMessage, setReplyToMessage] = useState(null);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuMessageId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Camera capture states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [chatFacingMode, setChatFacingMode] = useState('user');
  const cameraVideoRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all audio tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioChunksRef.current.length > 0) {
          const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
          
          // Send it using FileReader
          const reader = new FileReader();
          reader.onload = () => {
            const payload = {
              name: file.name,
              size: file.size,
              type: file.type,
              data: reader.result
            };
            sendMessage(JSON.stringify(payload), false, true);
          };
          reader.readAsDataURL(file);
        }

        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
      
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      setError('');
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: chatFacingMode },
            audio: false
          });
          setCameraStream(stream);
          if (cameraVideoRef.current) {
            cameraVideoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error starting camera stream:", err);
          setError("Camera access denied or not available.");
          setShowCameraModal(false);
        }
      }, 300);
    } catch (err) {
      console.error("Error showing camera modal:", err);
    }
  };

  const toggleChatCamera = async () => {
    const nextFacingMode = chatFacingMode === 'user' ? 'environment' : 'user';
    setChatFacingMode(nextFacingMode);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacingMode },
        audio: false
      });
      setCameraStream(stream);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error switching chat camera:", err);
      setError("Failed to switch camera.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return;

    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const reader = new FileReader();
        reader.onload = () => {
          const payload = {
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result
          };
          sendMessage(JSON.stringify(payload), false, true);
        };
        reader.readAsDataURL(file);
      }
      stopCamera();
    }, 'image/jpeg', 0.85);
  };

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showPasscodeReveal, setShowPasscodeReveal] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Chat message states
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const customStickerInputRef = useRef(null);
  const mediaPickerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Full set of curated developer GIFs
  const gifPresets = [
    { name: 'Keyboard Smash Coding', url: 'https://i.giphy.com/media/A8t585O0fWq9m59Zz7/giphy.gif' },
    { name: 'Success Dance Celebrate', url: 'https://i.giphy.com/media/26n61r3CT5Syp59c4/giphy.gif' },
    { name: 'Programming Bug Hunt', url: 'https://i.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
    { name: 'Coffee Refuel Caffeine', url: 'https://i.giphy.com/media/3oriO04qxVTYC0hgiA/giphy.gif' },
    { name: 'Coding Matrix Screen', url: 'https://i.giphy.com/media/QMiXvO6uSnoqc/giphy.gif' },
    { name: 'Mind Blown Shocked', url: 'https://i.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
    { name: 'Laptop Work Coding', url: 'https://i.giphy.com/media/13HgwGsXF0oZ4A/giphy.gif' },
    { name: 'Excited Developer Yay', url: 'https://i.giphy.com/media/LmN8OY2DAJCqQ/giphy.gif' },
    { name: 'Typing Fast Hackerman', url: 'https://i.giphy.com/media/o0vkSRjoHIfK/giphy.gif' },
    { name: 'Computer Explosion Crash', url: 'https://i.giphy.com/media/zOvDnWOSa26Vw/giphy.gif' },
    { name: 'Yes Agreement Smile', url: 'https://i.giphy.com/media/ZVik77JM4cC4g/giphy.gif' },
    { name: 'Facepalm Tired Headache', url: 'https://i.giphy.com/media/XGxlscqR85DQQ/giphy.gif' },
    { name: 'No Disagree Stop', url: 'https://i.giphy.com/media/d2jjuAZzDSVLZ5kI/giphy.gif' },
    { name: 'What Question Confused', url: 'https://i.giphy.com/media/t3kiYdg6bkxEI/giphy.gif' },
    { name: 'Congratulations Award Star', url: 'https://i.giphy.com/media/3o7TKSj06tqgZaJmiY/giphy.gif' },
    { name: 'Ship It Rocket Deploy', url: 'https://i.giphy.com/media/3oKIPnAiaMCws8nru0/giphy.gif' },
    { name: 'Fire Burning Hot', url: 'https://i.giphy.com/media/YQit0S1AMZySc/giphy.gif' },
    { name: 'Database Query Search', url: 'https://i.giphy.com/media/K3RxMSrICAQQSG1ScG/giphy.gif' },
    { name: 'Debugging Code Test', url: 'https://i.giphy.com/media/Lg1FRCgJFwb7RfGu65/giphy.gif' },
    { name: 'Sleeping Keyboard Tired', url: 'https://i.giphy.com/media/13rQ7rrTrvBsVW/giphy.gif' },
    { name: 'Caffeine Mug Hot Drink', url: 'https://i.giphy.com/media/bPCwGUF2s1WXm/giphy.gif' },
    { name: 'Cat Programmer Typing', url: 'https://i.giphy.com/media/vFKqnCdLPNOKc/giphy.gif' }
  ];

  const stickerPresets = [
    { name: 'LGTM', url: '/stickers/lgtm.svg' },
    { name: 'Ship It', url: '/stickers/shipit.svg' },
    { name: 'Fire', url: '/stickers/fire.svg' },
    { name: 'Coffee Cup', url: '/stickers/coffee.svg' },
    { name: 'Bulb Idea', url: '/stickers/idea.svg' },
    { name: 'Success Star', url: '/stickers/success.svg' }
  ];

  // Online GIF search using backend proxy (CORS-free, sequential keys, Tenor fallback)
  useEffect(() => {
    if (!gifSearchQuery.trim()) {
      setSearchedGifs([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingGifs(true);
      try {
        const res = await fetch(`/api/gifs/search?q=${encodeURIComponent(gifSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setSearchedGifs(data);
          } else {
            // Fallback to searching inside local presets if proxy returned empty
            const filtered = gifPresets.filter(g => g.name.toLowerCase().includes(gifSearchQuery.toLowerCase()));
            setSearchedGifs(filtered);
          }
        } else {
          // Fallback to local presets on proxy error
          const filtered = gifPresets.filter(g => g.name.toLowerCase().includes(gifSearchQuery.toLowerCase()));
          setSearchedGifs(filtered);
        }
      } catch (e) {
        console.error("Giphy search failed, falling back to local presets:", e);
        const filtered = gifPresets.filter(g => g.name.toLowerCase().includes(gifSearchQuery.toLowerCase()));
        setSearchedGifs(filtered);
      } finally {
        setLoadingGifs(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [gifSearchQuery]);

  // Sync active calls state
  useEffect(() => {
    if (!socket || !currentTeam) {
      setActiveCalls([]);
      return;
    }

    const fetchActiveCalls = async () => {
      try {
        const res = await fetch(`/api/teams/${currentTeam.id}/active-calls`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('pulse_token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setActiveCalls(data);
        }
      } catch (err) {
        console.error("Failed to fetch active calls:", err);
      }
    };

    fetchActiveCalls();
    socket.emit('get_active_calls', { teamId: currentTeam.id });

    socket.on('active_calls_update', (list) => {
      setActiveCalls(list);
    });

    return () => {
      socket.off('active_calls_update');
    };
  }, [socket, currentTeam]);

  // Process pending invites on login/signup
  useEffect(() => {
    const pendingInvite = localStorage.getItem('pending_invite_team_id');
    if (pendingInvite && user) {
      localStorage.removeItem('pending_invite_team_id');
      
      const joinInvite = async () => {
        try {
          const res = await fetch(`/api/teams/${pendingInvite}/join-invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('pulse_token')}`
            }
          });
          const data = await res.json();
          if (res.ok) {
            alert(`Successfully joined team via invite link: ${data.team.name}!`);
            window.location.reload();
          } else {
            alert(data.message || 'Failed to join team via invite link.');
          }
        } catch (e) {
          console.error("Invite join error:", e);
        }
      };
      
      joinInvite();
    }
  }, [user]);

  // Click outside detection for media picker and emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mediaPickerRef.current && !mediaPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[title="GIFs & Stickers"]')) {
          setShowMediaPicker(false);
        }
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        if (!event.target.closest('[title="Add Emoji"]')) {
          setShowEmojiPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for incoming call notifications from team members
  useEffect(() => {
    if (!socket) return;

    socket.on('incoming_call', ({ teamId, channelId, channelName, userName, callType }) => {
      setIncomingCallAlert({ teamId, channelId, channelName, userName, callType });
      
      // Play a premium chime sound for incoming calls
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav');
        audio.volume = 0.4;
        audio.play().catch(err => console.warn('Audio call chime play blocked/failed:', err));
      } catch (err) {
        console.error('Audio call chime play error:', err);
      }
    });

    return () => {
      socket.off('incoming_call');
    };
  }, [socket]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentChannel, currentTeam]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentTeam || !currentChannel) return;

    sendMessage(inputText, false, false, replyToMessage ? {
      id: replyToMessage.id,
      senderName: replyToMessage.senderName,
      text: replyToMessage.text
    } : null);
    setInputText('');
    setReplyToMessage(null);
  };

  const handleSendCodeSnippet = (e) => {
    e.preventDefault();
    if (!codeText.trim() || !currentTeam || !currentChannel) return;

    sendMessage(
      `Shared a ${codeLanguage} code snippet.`,
      false,
      false,
      replyToMessage ? {
        id: replyToMessage.id,
        senderName: replyToMessage.senderName,
        text: replyToMessage.text
      } : null,
      'code',
      JSON.stringify({ code: codeText, language: codeLanguage })
    );

    setCodeText('');
    setShowCodeModal(false);
    setReplyToMessage(null);
  };

  const handleLeaveTeamClick = async () => {
    if (!currentTeam) return;
    const confirmLeave = window.confirm(`Are you sure you want to leave "${currentTeam.name}"? You will lose access to all channels and chat history.`);
    if (!confirmLeave) return;

    try {
      setLoading(true);
      await leaveTeam(currentTeam.id);
    } catch (err) {
      alert(err.message || 'Error leaving team.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !passcode.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const created = await createNewTeam(teamName, passcode);
      setSuccess(`Team "${created.name}" created successfully! Code: ${created.id}`);
      setTeamName('');
      setPasscode('');
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error creating team.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeamSubmit = async (e) => {
    e.preventDefault();
    if (!joinTeamId.trim() || !joinPasscode.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const joined = await joinExistingTeam(joinTeamId, joinPasscode);
      setSuccess(`Successfully joined team "${joined.name}"!`);
      setJoinTeamId('');
      setJoinPasscode('');
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error joining team.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      setError('Channel name is required.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const chan = await createChannel(newChannelName, newChannelDesc);
      setSuccess(`Channel #${chan.name} created successfully!`);
      setNewChannelName('');
      setNewChannelDesc('');
      setCurrentChannel(chan);
      setTimeout(() => {
        setShowChannelModal(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error creating channel.');
    } finally {
      setLoading(false);
    }
  };

  const openProfileEditor = () => {
    setProfileName(user?.name || '');
    setProfileEmail(user?.email || '');
    setProfileAvatarColor(user?.avatarColor || '#6366f1');
    setProfileStatusMsg(user?.statusMessage || '');
    setProfileOnlineStatus(user?.onlineStatus || 'online');
    setProfileAvatarUrl(user?.avatarUrl || '');
    setProfilePhone(user?.phone || '');
    setProfileJobTitle(user?.jobTitle || '');
    setProfileDepartment(user?.department || '');
    setSelectedImage(null); // Reset file upload crop state
    setShowProfileModal(true);
    setShowProfileDropdown(false);
    setError('');
    setSuccess('');
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const openTeamEditor = () => {
    if (!currentTeam) return;
    setTeamEditName(currentTeam.name);
    setTeamEditAvatarColor(currentTeam.avatarColor || '#6366f1');
    setTeamEditAvatarUrl(currentTeam.avatarUrl || '');
    setShowTeamModal(true);
    setError('');
    setSuccess('');
  };

  const handleTeamPicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTeamEditAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateTeamProfile = async (e) => {
    e.preventDefault();
    if (!currentTeam) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamEditName,
          avatarUrl: teamEditAvatarUrl,
          avatarColor: teamEditAvatarColor
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Team settings updated successfully!');
        fetchTeams();
        setTimeout(() => {
          setShowTeamModal(false);
        }, 1000);
      } else {
        setError(data.message || 'Failed to update team profile.');
      }
    } catch (err) {
      console.error('Error updating team settings:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Drawing the circular crop area on the 200x200 preview canvas
  useEffect(() => {
    if (!selectedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      imgRef.current = img;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill background dark color
      ctx.fillStyle = '#0f111a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      
      // Circle parameters
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80; // 160px diameter circle viewport

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Calculate source positioning to preserve aspect ratio
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * cropZoom;
      const w = img.width * scale;
      const h = img.height * scale;
      const x = centerX - w / 2 + cropOffset.x;
      const y = centerY - h / 2 + cropOffset.y;

      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Draw active viewport circle outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };
  }, [selectedImage, cropZoom, cropOffset]);

  const handleCropMouseDown = (e) => {
    if (!selectedImage) return;
    setIsDraggingCrop(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleCropMouseMove = (e) => {
    if (!isDraggingCrop || !selectedImage) return;
    setCropOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const handleSaveCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    
    // Output 180x180 circle cropped image
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 180;
    outCanvas.height = 180;
    const outCtx = outCanvas.getContext('2d');

    outCtx.save();
    outCtx.beginPath();
    outCtx.arc(90, 90, 90, 0, Math.PI * 2);
    outCtx.clip();

    const img = imgRef.current;
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * cropZoom;
    const w = img.width * scale;
    const h = img.height * scale;
    
    // Scale offset factor from 200px preview canvas to 180px output canvas: 180 / 200 = 0.9
    const x = 90 - (w / 2) + (cropOffset.x * 0.9);
    const y = 90 - (h / 2) + (cropOffset.y * 0.9);

    outCtx.drawImage(img, x, y, w * 0.9, h * 0.9);
    outCtx.restore();

    const croppedBase64 = outCanvas.toDataURL('image/jpeg', 0.85);
    setProfileAvatarUrl(croppedBase64);
    setSelectedImage(null); // Close crop panel
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      setError('Name and Email are required.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          avatarColor: profileAvatarColor,
          statusMessage: profileStatusMsg,
          onlineStatus: profileOnlineStatus,
          avatarUrl: profileAvatarUrl,
          phone: profilePhone,
          jobTitle: profileJobTitle,
          department: profileDepartment
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const copyTeamId = () => {
    if (!currentTeam) return;
    navigator.clipboard.writeText(currentTeam.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendMedia = (url) => {
    sendMessage(url, true);
    setShowMediaPicker(false);
  };

  const handleFileAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const payload = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result // base64 representation of the file
      };
      sendMessage(JSON.stringify(payload), false, true); // text = JSON, isMedia = false, isAttachment = true
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input so same file can be clicked again
  };

  const handleCustomStickerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      sendMedia(reader.result); // send custom photo as sticker
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input
  };

  const chatKey = currentTeam && currentChannel ? `${currentTeam.id}_${currentChannel.id}` : '';
  const activeChannelMessages = chatKey ? messages[chatKey] || [] : [];

  const avatarColorOptions = [
    '#6366f1', // Indy Purple
    '#8b5cf6', // Violet
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Sky Cyan
    '#d946ef', // Magenta
    '#84cc16'  // Lime
  ];

  const presetAvatarUrls = [
    { name: 'Lead Dev', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
    { name: 'Architect', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
    { name: 'Designer', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
    { name: 'Engineer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' }
  ];

  const emojiPresets = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
    '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
    '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
    '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
    '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
    '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️',
    '🔥', '✨', '⚡', '💥', '🎈', '🎉', '🎊', '🎀',
    '💻', '🖥️', '⌨️', '🖱️', '🔋', '🔌', '💡', '📝'
  ];

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  const renderAvatar = (u, size = '40px', borderRadius = '12px', fontSize = '14px') => {
    const name = u?.name || 'U';
    const color = u?.avatarColor || '#6366f1';
    const status = u?.onlineStatus || 'online';
    const imgUrl = u?.avatarUrl;

    return (
      <div className="avatar" style={{ 
        width: size, 
        height: size, 
        fontSize: fontSize, 
        borderRadius: borderRadius, 
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: '#ffffff',
        position: 'relative',
        flexShrink: 0
      }}>
        {imgUrl ? (
          <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', borderRadius: borderRadius, objectFit: 'cover' }} />
        ) : (
          name.charAt(0).toUpperCase()
        )}
        <div className={`status-indicator ${status}`} style={{ 
          width: '10px', 
          height: '10px', 
          border: '1.5px solid #0d0f16',
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  };

  // Socket listeners for Admin operations and Theme synchronization
  useEffect(() => {
    if (!socket) return;

    const handleThemeUpdate = ({ teamId, theme }) => {
      if (currentTeam && currentTeam.id === teamId) {
        setCurrentTeam(prev => ({ ...prev, theme }));
      }
    };

    const handleMemberKick = ({ teamId, userId }) => {
      if (userId === user.id) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) return;
        alert(`You have been removed from the team: ${teamId}.`);
        window.location.reload();
      }
    };

    const handleTeamUpdate = ({ teamId }) => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) return;
      if (currentTeam && currentTeam.id === teamId) {
        window.location.reload();
      }
    };

    const handleAiTypingState = ({ channelId, isTyping }) => {
      if (currentChannel && currentChannel.id === channelId) {
        setAiTyping(isTyping);
      }
    };

    socket.on('team_theme_updated', handleThemeUpdate);
    socket.on('member_kicked', handleMemberKick);
    socket.on('team_updated', handleTeamUpdate);
    socket.on('ai_typing_state', handleAiTypingState);

    return () => {
      socket.off('team_theme_updated', handleThemeUpdate);
      socket.off('member_kicked', handleMemberKick);
      socket.off('team_updated', handleTeamUpdate);
      socket.off('ai_typing_state', handleAiTypingState);
    };
  }, [socket, currentTeam, user]);

  const handlePromoteAdmin = async (memberId) => {
    if (!window.confirm("Are you sure you want to promote this member to Admin?")) return;
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: memberId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to promote member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error promoting member.');
    }
  };

  const handleDemoteAdmin = async (memberId) => {
    if (!window.confirm("Are you sure you want to demote this member to Member?")) return;
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/demote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: memberId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to demote member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error demoting member.');
    }
  };

  const handleKickMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member from the team?")) return;
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/kick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: memberId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        window.location.reload();
      } else {
        alert(data.message || 'Failed to remove member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing member.');
    }
  };

  const handleThemeChange = async (themeName) => {
    try {
      const res = await fetch(`/api/teams/${currentTeam.id}/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: themeName })
      });
      const data = await res.json();
      if (res.ok) {
        setShowThemePicker(false);
      } else {
        alert(data.message || 'Failed to change theme.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to render chat message content
  const renderMessageContent = (msg) => {
    if (msg.isMedia) {
      return (
        <img 
          src={msg.text} 
          alt="media sticker" 
          style={{ 
            maxWidth: '180px', 
            maxHeight: '140px', 
            borderRadius: '8px', 
            display: 'block', 
            margin: '2px 0',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' 
          }} 
        />
      );
    }

    if (msg.isAttachment) {
      try {
        const fileInfo = JSON.parse(msg.text);
        const isImage = fileInfo.type?.startsWith('image/') || fileInfo.name?.match(/\.(jpeg|jpg|png|gif|webp)$/i);
        const isAudio = fileInfo.type?.startsWith('audio/') || fileInfo.name?.match(/\.(webm|wav|mp3|ogg|m4a)$/i);

        if (isImage) {
          return (
            <div style={{ marginTop: '4px' }}>
              <img 
                src={fileInfo.data} 
                alt={fileInfo.name} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '260px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-light)', 
                  display: 'block' 
                }} 
              />
              <a 
                href={fileInfo.data} 
                download={fileInfo.name} 
                style={{ 
                  fontSize: '11px', 
                  color: 'var(--accent-primary)', 
                  textDecoration: 'none', 
                  marginTop: '6px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px' 
                }}
              >
                <Download size={12} /> Download Original ({formatBytes(fileInfo.size)})
              </a>
            </div>
          );
        }

        if (isAudio) {
          return (
            <div style={{ 
              marginTop: '4px', 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '12px', 
              padding: '8px 12px',
              maxWidth: '300px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mic size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Voice Message</span>
              </div>
              <audio 
                controls 
                src={fileInfo.data} 
                style={{ width: '100%', height: '36px', outline: 'none' }} 
              />
            </div>
          );
        }

        return (
          <a 
            href={fileInfo.data} 
            download={fileInfo.name} 
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              textDecoration: 'none',
              marginTop: '4px',
              maxWidth: '280px',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'var(--border-light)';
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              flexShrink: 0
            }}>
              <FileIcon size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
              <span style={{ 
                fontSize: '12.5px', 
                fontWeight: 600, 
                color: 'var(--text-primary)', 
                textOverflow: 'ellipsis', 
                overflow: 'hidden', 
                whiteSpace: 'nowrap' 
              }}>
                {fileInfo.name}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {formatBytes(fileInfo.size)}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <Download size={16} />
            </div>
          </a>
        );
      } catch (err) {
        console.error("Error parsing attachment message:", err);
        return <p style={{ color: 'var(--error)' }}>⚠️ Broken Attachment Payload</p>;
      }
    }

    if (msg.type === 'code') {
      let code = '';
      let language = 'javascript';
      if (msg.attachment) {
        try {
          const payload = typeof msg.attachment === 'string' ? JSON.parse(msg.attachment) : msg.attachment;
          code = payload.code || '';
          language = payload.language || 'javascript';
        } catch (e) {
          code = msg.text;
        }
      } else {
        code = msg.text;
      }
      return <CodeSnippetBlock code={code} language={language} />;
    }

    if (msg.senderId === 'ai-assistant') {
      const lines = msg.text.split('\n');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {lines.map((line, idx) => {
            if (line.startsWith('### ')) {
              return <h3 key={idx} style={{ fontSize: '15px', fontWeight: 700, margin: '8px 0 4px 0', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('* **')) {
              const matches = line.match(/\* \*\*(.*?)\*\*:(.*)/);
              if (matches) {
                return (
                  <div key={idx} style={{ fontSize: '13px', margin: '2px 0 2px 12px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{matches[1]}:</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{matches[2]}</span>
                  </div>
                );
              }
            }
            if (line.startsWith('* ')) {
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', fontSize: '13px', margin: '2px 0 2px 8px', color: 'var(--text-secondary)' }}>
                  <span>•</span>
                  <span>{line.replace('* ', '')}</span>
                </div>
              );
            }
            if (line.startsWith('  - ')) {
              return (
                <div key={idx} style={{ display: 'flex', gap: '6px', fontSize: '12.5px', margin: '1px 0 1px 24px', color: 'var(--text-muted)' }}>
                  <span>◦</span>
                  <span>{line.replace('  - ', '')}</span>
                </div>
              );
            }
            if (line.trim().startsWith('*Generated')) {
              return <em key={idx} style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>{line.replace(/\*/g, '')}</em>;
            }
            return <p key={idx} style={{ margin: '2px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{line}</p>;
          })}
        </div>
      );
    }

    return <p>{msg.text}</p>;
  };

  const containerClassNames = [
    "app-container",
    mobileSidebarOpen ? "mobile-sidebar-active" : "",
    showMembersPanel ? "show-members-active" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClassNames} style={activeStyle}>
      {/* Mobile Top Header Bar */}
      <header className="mobile-top-bar" style={{ display: 'none' }}>
        <button
          className="mobile-menu-toggle-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Navigation Sidebar"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="mobile-logo-title">Pulse</span>
      </header>

      {/* Real-time Incoming Call Ring Toast */}
      {incomingCallAlert && (
        <div 
          className="incoming-call-alert-banner glass-panel animate-fade"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: 'rgba(15, 17, 26, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            padding: '16px 20px',
            borderRadius: '16px',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            minWidth: '320px',
            color: 'white'
          }}
        >
          <div 
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              animation: 'pulse-alert 1.5s infinite'
            }}
          >
            {incomingCallAlert.callType === 'video' ? <Sparkles size={22} /> : <Phone size={20} />}
          </div>
          
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Incoming Call</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {incomingCallAlert.userName} is calling in #{incomingCallAlert.channelName}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const matchTeam = teams.find(t => t.id === incomingCallAlert.teamId);
                if (matchTeam) {
                  setCurrentTeam(matchTeam);
                  if (matchTeam.channels) {
                    const matchChan = matchTeam.channels.find(c => c.id === incomingCallAlert.channelId);
                    if (matchChan) {
                      setCurrentChannel(matchChan);
                    }
                  }
                }
                setCallType(incomingCallAlert.callType);
                setInCall(true);
                setIncomingCallAlert(null);
              }}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              Accept
            </button>
            <button
              onClick={() => setIncomingCallAlert(null)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={attachmentInputRef} 
        onChange={handleFileAttachmentChange} 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={customStickerInputRef} 
        onChange={handleCustomStickerChange} 
        style={{ display: 'none' }} 
      />

      {/* 1. Main Navigation Sidebar */}
      <aside className="main-sidebar">
        <div className="sidebar-brand" style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="brand-logo-container" title="Pulse Workspace" style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
          >
            <svg viewBox="0 0 100 100" style={{ width: '32px', height: '32px' }}>
              <defs>
                <filter id="brandNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="brandStemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="brandLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="50%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="brandPulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="38" fill="rgba(139, 92, 246, 0.15)" filter="url(#brandNeonGlow)" />
              <rect x="26" y="20" width="12" height="60" rx="6" fill="url(#brandStemGrad)" />
              <path d="M38,20 H58 C72,20 80,28 80,41 C80,54 72,62 58,62 H38 Z" fill="url(#brandLoopGrad)" filter="url(#brandNeonGlow)" />
              <path d="M38,32 H54 C61,32 66,35 66,41 C66,47 61,50 54,50 H38 Z" fill="#0f111a" />
              <path d="M48,50 L54,43 L60,53 L66,35 L72,48 L80,44" fill="none" stroke="url(#brandPulseGrad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#brandNeonGlow)" />
            </svg>
          </div>
        </div>

        {/* Dynamic Teams Icons List */}
        <div className="sidebar-teams-list">
          {teams.map((team) => {
            const isActive = currentTeam?.id === team.id;
            return (
              <button
                key={team.id}
                className={`team-icon-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTeam(team);
                  if (team.channels && team.channels.length > 0) {
                    setCurrentChannel(team.channels[0]);
                  } else {
                    setCurrentChannel(null);
                  }
                  setMobileSidebarOpen(false);
                }}
                title={team.name}
              >
                {team.avatarUrl ? (
                  <img 
                    src={team.avatarUrl} 
                    alt={team.name} 
                    className="team-icon-avatar"
                    style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover' }} 
                  />
                ) : (
                  <div className="team-icon-avatar" style={{ background: isActive ? 'var(--accent-gradient)' : (team.avatarColor || 'rgba(255,255,255,0.05)') }}>
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="team-active-indicator"></div>
              </button>
            );
          })}

          <button 
            className="team-icon-btn create-join-btn" 
            onClick={() => {
              setShowModal(true);
              setModalTab('create');
              setError('');
              setSuccess('');
            }}
            title="Create or Join a Team"
          >
            <div className="team-icon-avatar plus-icon">
              <Plus size={20} />
            </div>
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" title="Settings" onClick={openProfileEditor}>
            <Settings size={20} />
          </button>
          
          <div className="profile-container">
            <button 
              className="profile-trigger" 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {renderAvatar(user, '40px', '12px', '15px')}
            </button>

            {showProfileDropdown && (
              <div className="profile-dropdown glass-panel">
                <div className="dropdown-header">
                  <p className="user-name">{user?.name}</p>
                  <p className="user-email">{user?.email}</p>
                  {user?.statusMessage && <p className="user-status-msg">💬 {user.statusMessage}</p>}
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={openProfileEditor}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={logout}>
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Sub-Sidebar (Channels list for active team) */}
      <section className="sub-sidebar">
        {currentTeam ? (
          <>
            <div className="sub-sidebar-header">
              <div className="team-select" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', overflow: 'hidden' }}>
                {currentTeam.avatarUrl ? (
                  <img 
                    src={currentTeam.avatarUrl} 
                    alt={currentTeam.name} 
                    className="team-avatar"
                    style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                  />
                ) : (
                  <span className="team-avatar" style={{ backgroundColor: currentTeam.avatarColor || '#6366f1', flexShrink: 0 }}>
                    {currentTeam.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="team-info" style={{ overflow: 'hidden', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <h2 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', margin: 0, fontSize: '15px' }}>{currentTeam.name}</h2>
                    {currentUserIsAdmin && (
                      <button
                        onClick={openTeamEditor}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'background 0.2s, color 0.2s',
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                        title="Edit Team Profile & Name"
                      >
                        <Settings size={13} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <p onClick={() => setShowMembersPanel(true)} style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                      {members?.length || 1} members
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>•</span>
                    <button
                      onClick={handleLeaveTeamClick}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fca5a5',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                        transition: 'color 0.2s'
                      }}
                      title="Leave Team"
                    >
                      <LogOut size={11} />
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="sub-sidebar-content">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input type="text" placeholder="Search channels..." />
              </div>

              <div className="channel-list-container">
                <div className="section-title-row">
                  <h3>CHANNELS</h3>
                  <button 
                    className="icon-add-btn" 
                    title="Create Channel"
                    onClick={() => {
                      setNewChannelName('');
                      setNewChannelDesc('');
                      setShowChannelModal(true);
                      setError('');
                      setSuccess('');
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="channel-list">
                  {currentTeam.channels?.map((chan) => {
                    const hasActiveCall = activeCalls.some(call => call.channelId === chan.id);
                    return (
                      <button
                        key={chan.id}
                        className={`channel-item ${currentChannel?.id === chan.id ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentChannel(chan);
                          setMobileSidebarOpen(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Hash size={16} className="hash-icon" />
                          <span>{chan.name}</span>
                        </div>
                        {hasActiveCall && (
                          <div 
                            style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: '#10b981', 
                              boxShadow: '0 0 8px #10b981',
                              marginRight: '6px'
                            }} 
                            className="pulse-badge-animation"
                            title="Active Call"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-sub-sidebar">
            <ShieldAlert size={36} className="alert-icon" />
            <p>No active workspace. Create or join a team to get started.</p>
            <button 
              className="glow-btn start-cta-btn"
              onClick={() => {
                setShowModal(true);
                setModalTab('create');
              }}
            >
              Get Started
            </button>
          </div>
        )}
      </section>

      {/* 3. Main Content Panel */}
      <main className="main-content">
        {currentTeam && currentChannel ? (
          <>
            <header className="content-header">
              <div className="header-left">
                <Hash size={20} className="header-hash" />
                <h1>{currentChannel.name}</h1>
                <span className="header-divider"></span>
                <p className="header-desc">{currentChannel.description || 'Welcome to the channel'}</p>
              </div>

              <div className="header-right">
                {/* Team Access Info Card */}
                <div className="team-credentials-badge glass-panel">
                  <div 
                    className="cred-item invite-link-badge" 
                    onClick={() => {
                      const inviteUrl = `${window.location.origin}/?invite=${currentTeam.id}`;
                      navigator.clipboard.writeText(inviteUrl);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2000);
                    }} 
                    title="Click to copy Invite Link"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderColor: 'rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <span className="label" style={{ color: 'var(--accent-primary)' }}>INVITE:</span>
                    <span className="value" style={{ fontWeight: '600' }}>Copy Link</span>
                    {copiedInvite ? <ClipboardCheck size={12} className="copy-icon success" /> : <Copy size={12} className="copy-icon" style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                  <div className="cred-item" onClick={copyTeamId} title="Click to copy Team ID">
                    <span className="label">ID:</span>
                    <span className="value font-mono">{currentTeam.id}</span>
                    {copied ? <ClipboardCheck size={12} className="copy-icon success" /> : <Copy size={12} className="copy-icon" />}
                  </div>
                  <div className="cred-item" onClick={() => setShowPasscodeReveal(!showPasscodeReveal)} title="Click to reveal Passcode">
                    <span className="label">CODE:</span>
                    <span className="value font-mono">
                      {showPasscodeReveal ? currentTeam.passcode : '••••••'}
                    </span>
                    {showPasscodeReveal ? <EyeOff size={12} className="eye-icon" /> : <Eye size={12} className="eye-icon" />}
                  </div>
                </div>

                {currentUserIsAdmin && (
                  <div style={{ position: 'relative' }}>
                    <button 
                      className={`header-btn ${showThemePicker ? 'active' : ''}`} 
                      title="Change Chat Theme"
                      onClick={() => setShowThemePicker(!showThemePicker)}
                      style={{
                        color: showThemePicker ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        borderColor: showThemePicker ? 'var(--accent-primary)' : 'var(--border-light)'
                      }}
                    >
                      <Sparkles size={18} />
                    </button>
                    {showThemePicker && (
                      <div className="glass-panel theme-dropdown animate-fade" style={{
                        position: 'absolute',
                        top: '50px',
                        right: '0',
                        width: '200px',
                        borderRadius: '12px',
                        padding: '12px',
                        zIndex: 100,
                        boxShadow: 'var(--shadow-lg)',
                        background: 'rgba(15, 17, 26, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SELECT THEME</span>
                        {Object.keys(themeColors).map((themeName) => {
                          const isSelected = selectedTheme === themeName;
                          return (
                            <button
                              key={themeName}
                              type="button"
                              onClick={() => handleThemeChange(themeName)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s ease',
                                textAlign: 'left'
                              }}
                              className="theme-item-hover"
                            >
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: themeColors[themeName]['--accent-gradient']
                              }} />
                              <span style={{ textTransform: 'capitalize', fontWeight: isSelected ? '600' : '400' }}>
                                {themeName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  className={`header-btn ${showMembersPanel ? 'active' : ''}`} 
                  title="Team Members"
                  onClick={() => setShowMembersPanel(!showMembersPanel)}
                  style={{
                    color: showMembersPanel ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderColor: showMembersPanel ? 'var(--accent-primary)' : 'var(--border-light)'
                  }}
                >
                  <Users size={18} />
                </button>
                {activeCalls.some(call => call.channelId === currentChannel.id) ? (
                  <button 
                    className="header-btn glow-btn-header" 
                    title="Join Active Call" 
                    onClick={() => {
                      const activeCall = activeCalls.find(call => call.channelId === currentChannel.id);
                      setCallType(activeCall?.callType || 'video');
                      setInCall(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderColor: '#10b981',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Join Call</span>
                  </button>
                ) : (
                  <>
                    <button 
                      className="header-btn" 
                      title="Start Voice Call" 
                      onClick={() => {
                        setCallType('voice');
                        setInCall(true);
                        if (socket && currentTeam && currentChannel) {
                          socket.emit('start_call', {
                            teamId: currentTeam.id,
                            channelId: currentChannel.id,
                            channelName: currentChannel.name,
                            userName: user.name,
                            userId: user.id,
                            callType: 'voice'
                          });
                        }
                      }}
                    >
                      <Phone size={18} />
                    </button>
                    <button 
                      className="header-btn glow-btn-header" 
                      title="Start Meeting Call" 
                      onClick={() => {
                        setCallType('video');
                        setInCall(true);
                        if (socket && currentTeam && currentChannel) {
                          socket.emit('start_call', {
                            teamId: currentTeam.id,
                            channelId: currentChannel.id,
                            channelName: currentChannel.name,
                            userName: user.name,
                            userId: user.id,
                            callType: 'video'
                          });
                        }
                      }}
                    >
                      <Sparkles size={16} />
                      <span>Meet</span>
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Chat feed body */}
            <div className="content-body chat-theme" style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <div className="chat-messages-container" style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
                  {activeChannelMessages.map((msg) => {
                    const isOwnMsg = msg.senderId === user?.id;
                    const handleReplySelect = () => {
                      let preview = msg.text;
                      if (msg.isAttachment) {
                        try {
                          const payload = JSON.parse(msg.text);
                          preview = payload.type?.startsWith('audio') ? "[Voice Message]" : "[Photo Snapshot]";
                        } catch(e) {
                          preview = "[Attachment]";
                        }
                      }
                      setReplyToMessage({ id: msg.id, senderName: msg.senderName, text: preview });
                    };

                    return (
                      <MessageSwipeRow key={msg.id} msg={msg} onReply={handleReplySelect}>
                        <div 
                          id={`msg-${msg.id}`} 
                          className={`message-bubble-wrapper ${msg.isSystem ? 'system-msg' : ''}`}
                          style={{
                            borderRadius: '8px',
                            padding: '4px 8px',
                            margin: '4px 0',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {!msg.isSystem && (
                            <div className="message-avatar" style={{ backgroundColor: msg.senderAvatarColor || '#6366f1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                              {msg.senderAvatarUrl ? (
                                <img src={msg.senderAvatarUrl} alt={msg.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (msg.senderName || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                          )}
                          <div className="message-content-area" style={{ flexGrow: 1, maxWidth: '85%' }}>
                            {!msg.isSystem && (
                              <div className="message-meta">
                                <span className="sender-name">{msg.senderName}</span>
                                <span className="timestamp">{formatTime(msg.timestamp)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <div 
                                className="message-bubble" 
                                style={
                                  msg.isSystem ? { width: '100%' } : 
                                  isOwnMsg ? {
                                    background: 'rgba(139, 92, 246, 0.12)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderLeft: '4px solid #a78bfa',
                                    flexGrow: 1,
                                    maxWidth: '100%'
                                  } : {
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderLeft: '4px solid rgba(255, 255, 255, 0.18)',
                                    flexGrow: 1,
                                    maxWidth: '100%'
                                  }
                                }
                              >
                                {msg.replyTo && (
                                  <div 
                                    className="replied-message-quote"
                                    style={{
                                      background: 'rgba(0, 0, 0, 0.25)',
                                      borderLeft: '3px solid var(--accent-primary)',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      marginBottom: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      maxHeight: '60px',
                                      overflow: 'hidden'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const originalMsgElement = document.getElementById(`msg-${msg.replyTo.id}`);
                                      if (originalMsgElement) {
                                        originalMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        originalMsgElement.style.background = 'rgba(99, 102, 241, 0.25)';
                                        originalMsgElement.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
                                        setTimeout(() => {
                                          originalMsgElement.style.background = '';
                                          originalMsgElement.style.boxShadow = '';
                                        }, 1500);
                                      }
                                    }}
                                  >
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '11px', marginBottom: '2px' }}>
                                      {msg.replyTo.senderName}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {msg.replyTo.text}
                                    </div>
                                  </div>
                                )}
                                {renderMessageContent(msg)}
                              </div>

                              {/* Three-dots menu action for PC */}
                              {!msg.isSystem && (
                                <div className="message-menu-container" style={{ position: 'relative', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id);
                                    }}
                                    className="message-three-dots-btn"
                                    title="Message options"
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      border: '1px solid var(--border-light)',
                                      borderRadius: '6px',
                                      width: '28px',
                                      height: '28px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', display: 'block', marginTop: '-8px' }}>...</span>
                                  </button>
                                  
                                  {activeMenuMessageId === msg.id && (
                                    <div 
                                      className="message-dropdown-menu glass-panel" 
                                      style={{
                                        position: 'absolute',
                                        top: '32px',
                                        right: isOwnMsg ? 0 : 'auto',
                                        left: isOwnMsg ? 'auto' : 0,
                                        background: 'rgba(15, 17, 26, 0.95)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: '8px',
                                        padding: '4px',
                                        zIndex: 100,
                                        minWidth: '100px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleReplySelect();
                                          setActiveMenuMessageId(null);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--text-primary)',
                                          padding: '6px 12px',
                                          fontSize: '13px',
                                          textAlign: 'left',
                                          cursor: 'pointer',
                                          borderRadius: '4px',
                                          width: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                      >
                                        <MessageSquare size={13} style={{ transform: 'scaleX(-1)' }} />
                                        <span>Reply</span>
                                      </button>
                                      {isOwnMsg && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("Are you sure you want to unsend this message?")) {
                                              deleteMessage(msg.id);
                                            }
                                            setActiveMenuMessageId(null);
                                          }}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            padding: '6px 12px',
                                            fontSize: '13px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            borderRadius: '4px',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                          }}
                                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                          <Trash2 size={13} />
                                          <span>Unsend</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </MessageSwipeRow>
                    );
                  })}
                  {aiTyping && (
                    <div className="message-bubble-wrapper system-msg" style={{ margin: '8px 0', padding: '4px 8px', display: 'flex', gap: '8px' }}>
                      <div className="message-avatar" style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', width: '32px', height: '32px' }}>
                        🤖
                      </div>
                      <div className="message-content-area" style={{ flexGrow: 1 }}>
                        <div className="message-meta" style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>Pulse AI</span>
                        </div>
                        <div className="message-bubble" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI is thinking</span>
                          <span className="pulse-dots" style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse-dot 1.4s infinite both' }}></span>
                            <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse-dot 1.4s infinite both 0.2s' }}></span>
                            <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse-dot 1.4s infinite both 0.4s' }}></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Floating Media Picker Panel (GIFs & Stickers) */}
                {showMediaPicker && (
                  <div ref={mediaPickerRef} className="glass-panel animate-fade" style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '20px',
                    width: '340px',
                    height: '280px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    background: 'rgba(15, 17, 26, 0.92)',
                    backdropFilter: 'blur(16px)',
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '6px', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => setMediaPickerTab('gifs')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          background: mediaPickerTab === 'gifs' ? 'var(--bg-active)' : 'transparent',
                          color: mediaPickerTab === 'gifs' ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        GIFs (Giphy)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setMediaPickerTab('stickers')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          border: 'none',
                          borderRadius: '6px',
                          background: mediaPickerTab === 'stickers' ? 'var(--bg-active)' : 'transparent',
                          color: mediaPickerTab === 'stickers' ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Stickers
                      </button>
                    </div>

                    <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {mediaPickerTab === 'gifs' ? (
                        <>
                          <div style={{ position: 'relative', marginBottom: '4px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                              type="text" 
                              placeholder="Search live GIPHY..."
                              value={gifSearchQuery}
                              onChange={(e) => setGifSearchQuery(e.target.value)}
                              style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--border-light)',
                                padding: '6px 10px 6px 28px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: 'white',
                                outline: 'none'
                              }}
                            />
                          </div>

                          {loadingGifs ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                              <span className="loader"></span>
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                              {(searchedGifs.length > 0 ? searchedGifs : gifPresets).map(gif => (
                                <img
                                  key={gif.url}
                                  src={gif.url}
                                  alt={gif.name}
                                  onClick={() => sendMedia(gif.url)}
                                  style={{
                                    width: '100%',
                                    height: '70px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'transform 0.15s ease'
                                  }}
                                  className="media-item-hover"
                                />
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Stickers picker */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {stickerPresets.map(sticker => (
                              <div 
                                key={sticker.url}
                                onClick={() => sendMedia(sticker.url)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '64px',
                                  background: 'rgba(255,255,255,0.02)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  transition: 'all 0.15s ease'
                                }}
                                className="media-item-hover"
                              >
                                <img src={sticker.url} alt={sticker.name} style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
                              </div>
                            ))}
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => customStickerInputRef.current.click()}
                              style={{
                                width: '100%',
                                padding: '8px',
                                background: 'var(--accent-gradient)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <Plus size={14} />
                              Upload Custom Sticker
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating Emoji Picker Panel */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="glass-panel animate-fade" style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: '20px',
                    width: '340px',
                    height: '280px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10,
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    background: 'rgba(15, 17, 26, 0.92)',
                    backdropFilter: 'blur(16px)',
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', padding: '10px 14px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Select Emoji</span>
                      <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ flexGrow: 1, overflowY: 'auto', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', alignContent: 'start' }}>
                      {emojiPresets.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '22px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          className="media-item-hover"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {replyToMessage && (
                  <div className="reply-preview-bar animate-fade" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderLeft: '4px solid var(--accent-primary)',
                    borderRadius: '8px 8px 0 0',
                    borderTop: '1px solid var(--border-light)',
                    borderRight: '1px solid var(--border-light)',
                    marginLeft: '20px',
                    marginRight: '20px',
                    marginTop: '10px',
                    position: 'relative',
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', width: '90%' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        Replying to {replyToMessage.senderName}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%'
                      }}>
                        {replyToMessage.text}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setReplyToMessage(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Chat Input form */}
                <form 
                  onSubmit={handleSendMessage} 
                  className="chat-input-wrapper glass-panel"
                  style={replyToMessage ? {
                    borderTopLeftRadius: '0px',
                    borderTopRightRadius: '0px',
                    borderTop: 'none',
                    marginTop: '0px'
                  } : {}}
                >
                  <button 
                    type="button" 
                    className="input-action-btn" 
                    title="Attach Files"
                    onClick={() => attachmentInputRef.current.click()}
                  >
                    <Paperclip size={18} />
                  </button>
                  <button 
                    type="button" 
                    className="input-action-btn" 
                    title="Record Voice Message"
                    onClick={startRecording}
                  >
                    <Mic size={18} />
                  </button>
                  <button 
                    type="button" 
                    className="input-action-btn" 
                    title="Capture Photo"
                    onClick={startCamera}
                  >
                    <Camera size={18} />
                  </button>
                  <button 
                    type="button" 
                    className="input-action-btn" 
                    title="Share Code Snippet"
                    onClick={() => setShowCodeModal(true)}
                  >
                    <Code size={18} />
                  </button>

                  {isRecording ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, padding: '0 8px' }}>
                      <div 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: '#ef4444', 
                          animation: 'pulse-alert 1s infinite' 
                        }} 
                      />
                      <span style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 600 }}>
                        Recording: {formatDuration(recordingDuration)}
                      </span>
                      <button 
                        type="button" 
                        onClick={cancelRecording} 
                        style={{ 
                          marginLeft: 'auto', 
                          background: 'rgba(239, 68, 68, 0.15)', 
                          border: '1px solid rgba(239, 68, 68, 0.25)', 
                          color: '#fca5a5', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={stopRecording} 
                        style={{ 
                          background: '#10b981', 
                          border: 'none', 
                          color: 'white', 
                          padding: '6px 14px', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <>
                      <textarea 
                        className="chat-input-field" 
                        placeholder={`Send a message to #${currentChannel.name}`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        style={{
                          resize: 'none',
                          height: '38px',
                          paddingTop: '9px',
                          paddingBottom: '9px',
                          fontFamily: 'inherit',
                          lineHeight: '1.4',
                          border: 'none',
                          background: 'transparent',
                          color: 'white',
                          flexGrow: 1,
                          outline: 'none',
                          fontSize: '14px'
                        }}
                        rows={1}
                      />
                      <button 
                        type="button" 
                        className="input-action-btn" 
                        title="Add Emoji"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowMediaPicker(false);
                        }}
                        style={{ color: showEmojiPicker ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                      >
                        <Smile size={18} />
                      </button>
                      <button 
                        type="button" 
                        className="input-action-btn" 
                        title="GIFs & Stickers"
                        onClick={() => {
                          setShowMediaPicker(!showMediaPicker);
                          setShowEmojiPicker(false);
                        }}
                        style={{ color: showMediaPicker ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                      >
                        <Sparkles size={18} />
                      </button>
                      <button type="submit" className="send-msg-btn glow-btn" title="Send message">
                        <Send size={16} />
                      </button>
                    </>
                  )}
                </form>
              </div>

              {/* Members Sidebar Panel on the Right */}
              {showMembersPanel && (
                <aside className="members-panel glass-panel" style={{
                  width: '260px',
                  borderLeft: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  background: 'rgba(10, 11, 16, 0.45)',
                  flexShrink: 0,
                  animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>TEAM MEMBERS ({members.length})</h3>
                    <button 
                      onClick={() => setShowMembersPanel(false)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="members-list" style={{ overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {members.map(member => {
                      const admins = currentTeam.admins || [currentTeam.creatorId];
                      const isMemberAdmin = admins.includes(member.id);
                      const currentUserIsAdmin = admins.includes(user.id);
                      const isMemberInCall = activeCalls.some(call => call.userIds && call.userIds.includes(member.id));
                      
                      return (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                          {renderAvatar(member, '32px', '8px', '13px')}
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', lineHeight: '1.2', flexWrap: 'wrap', gap: '4px' }}>
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{member.name}</span>
                              {member.id === currentTeam.creatorId ? (
                                <span style={{ fontSize: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '0px 4px', borderRadius: '4px', flexShrink: 0 }}>Owner</span>
                              ) : isMemberAdmin ? (
                                <span style={{ fontSize: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#a7f3d0', padding: '0px 4px', borderRadius: '4px', flexShrink: 0 }}>Admin</span>
                              ) : null}
                            </span>
                            
                            {/* Member contact & details */}
                            {(member.jobTitle || member.department) && (
                              <span style={{ fontSize: '10.5px', color: 'var(--accent-primary)', marginTop: '2px', fontWeight: 500 }}>
                                {member.jobTitle || ''} {member.department ? `(${member.department})` : ''}
                              </span>
                            )}

                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {member.statusMessage || member.email}
                            </span>

                            {member.phone && (
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                📞 {member.phone}
                              </span>
                            )}

                            {isMemberInCall && (
                              <span style={{ fontSize: '10.5px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <Phone size={10} style={{ fill: '#34d399' }} /> In a call
                              </span>
                            )}
                          </div>

                          {/* Admin Actions */}
                          {currentUserIsAdmin && member.id !== user.id && (
                            <div style={{ display: 'flex', gap: '4px', alignSelf: 'center', flexShrink: 0, marginLeft: '6px' }}>
                              {!isMemberAdmin && (
                                <button
                                  onClick={() => handlePromoteAdmin(member.id)}
                                  title="Promote to Admin"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '4px',
                                    color: '#34d399',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                  }}
                                >
                                  <Shield size={12} />
                                </button>
                              )}
                              {isMemberAdmin && member.id !== currentTeam.creatorId && (
                                <button
                                  onClick={() => handleDemoteAdmin(member.id)}
                                  title="Demote to Admin"
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '4px',
                                    color: '#fbbf24',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                                  }}
                                >
                                  <ShieldAlert size={12} />
                                </button>
                              )}
                              {(member.id !== currentTeam.creatorId && (!isMemberAdmin || user.id === currentTeam.creatorId)) && (
                                <button
                                  onClick={() => handleKickMember(member.id)}
                                  title="Remove from Team"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '4px',
                                    color: '#fca5a5',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </aside>
              )}
            </div>
          </>
        ) : (
          /* Landing page when no team is joined/selected */
          <div className="welcome-workspace animate-fade empty-state">
            <div className="welcome-accent-glowing"></div>
            
            <div className="welcome-hero text-center">
              <div className="sparkle-badge mx-auto">
                <Sparkles size={14} />
                <span>PULSE COLLABORATION PORTAL</span>
              </div>
              <h1>Create or Join a Space</h1>
              <p>Pulse connects teams globally through high-fidelity channels. To start collaborating, either setup a new team or join an existing workspace using a team ID and secure passcode.</p>
            </div>

            <div className="empty-selection-cards">
              <div className="selection-card glass-panel highlight-purple" onClick={() => { setModalTab('create'); setShowModal(true); }}>
                <div className="card-icon-wrapper">
                  <Plus size={28} />
                </div>
                <h3>Create New Team</h3>
                <p>Launch your own secure workspace, customize channels, and generate an access passcode for your colleagues.</p>
                <button className="glow-btn start-cta">Start A Team</button>
              </div>

              <div className="selection-card glass-panel" onClick={() => { setModalTab('join'); setShowModal(true); }}>
                <div className="card-icon-wrapper">
                  <Key size={28} />
                </div>
                <h3>Join Existing Team</h3>
                <p>Have an invite ID and passcode? Enter them to instantly bind your account to the target workspace and start talking.</p>
                <button className="btn-secondary start-cta">Join A Team</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Glassmorphic Modal for Creating/Joining Teams */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content-card glass-panel animate-fade">
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${modalTab === 'create' ? 'active' : ''}`}
                onClick={() => { setModalTab('create'); setError(''); setSuccess(''); }}
              >
                Create Team
              </button>
              <button 
                className={`modal-tab-btn ${modalTab === 'join' ? 'active' : ''}`}
                onClick={() => { setModalTab('join'); setError(''); setSuccess(''); }}
              >
                Join Team
              </button>
            </div>

            <div className="modal-divider"></div>

            {error && (
              <div className="modal-alert error animate-fade">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="modal-alert success animate-fade">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            {modalTab === 'create' ? (
              <form onSubmit={handleCreateTeamSubmit} className="modal-form">
                <div className="input-group">
                  <label htmlFor="team-name">Team Name</label>
                  <input
                    type="text"
                    id="team-name"
                    className="input-field"
                    placeholder="e.g. Akiyama Developers"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="team-passcode">Access Passcode (Secret)</label>
                  <input
                    type="password"
                    id="team-passcode"
                    className="input-field"
                    placeholder="e.g. dev-sprint-2026"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="glow-btn modal-submit" disabled={loading}>
                  {loading ? <span className="loader"></span> : 'Establish Workspace'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinTeamSubmit} className="modal-form">
                <div className="input-group">
                  <label htmlFor="join-id">Team ID Code</label>
                  <input
                    type="text"
                    id="join-id"
                    className="input-field font-mono"
                    placeholder="e.g. PULSE-ABCDEF"
                    value={joinTeamId}
                    onChange={(e) => setJoinTeamId(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="join-passcode">Access Passcode</label>
                  <input
                    type="password"
                    id="join-passcode"
                    className="input-field"
                    placeholder="Enter passcode"
                    value={joinPasscode}
                    onChange={(e) => setJoinPasscode(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="glow-btn modal-submit" disabled={loading}>
                  {loading ? <span className="loader"></span> : 'Request Access'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. Glassmorphic Modal for Channel Creation */}
      {showChannelModal && (
        <div className="modal-backdrop">
          <div className="modal-content-card glass-panel animate-fade">
            <button className="modal-close-btn" onClick={() => setShowChannelModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Create a Channel</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Channels are where conversation occurs on topics.</p>
            </div>

            <div className="modal-divider"></div>

            {error && (
              <div className="modal-alert error animate-fade">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="modal-alert success animate-fade">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleCreateChannelSubmit} className="modal-form">
              <div className="input-group">
                <label htmlFor="chan-name">Channel Name</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    id="chan-name"
                    className="input-field"
                    style={{ paddingLeft: '34px' }}
                    placeholder="e.g. dev-discussion"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="chan-desc">Description (Optional)</label>
                <input
                  type="text"
                  id="chan-desc"
                  className="input-field"
                  placeholder="e.g. Discuss code architecture"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="glow-btn modal-submit" disabled={loading}>
                {loading ? <span className="loader"></span> : 'Create Channel'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Glassmorphic Modal for User Profile Update */}
      {showProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-content-card glass-panel animate-fade" style={{ maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Personal Settings</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customize how you appear and share contact info.</p>
            </div>

            <div className="modal-divider"></div>

            {error && (
              <div className="modal-alert error animate-fade">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="modal-alert success animate-fade">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="modal-form" style={{ gap: '14px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-name">Display Name</label>
                  <input
                    type="text"
                    id="prof-name"
                    className="input-field"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-email">Email Address</label>
                  <input
                    type="email"
                    id="prof-email"
                    className="input-field"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-job">Job Title</label>
                  <input
                    type="text"
                    id="prof-job"
                    className="input-field"
                    placeholder="e.g. Lead Frontend Dev"
                    value={profileJobTitle}
                    onChange={(e) => setProfileJobTitle(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-dept">Department</label>
                  <input
                    type="text"
                    id="prof-dept"
                    className="input-field"
                    placeholder="e.g. Engineering"
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-phone">Phone Number</label>
                  <input
                    type="text"
                    id="prof-phone"
                    className="input-field"
                    placeholder="e.g. +1 (555) 0199"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label htmlFor="prof-status">Online Status</label>
                  <select
                    id="prof-status"
                    className="input-field"
                    value={profileOnlineStatus}
                    onChange={(e) => setProfileOnlineStatus(e.target.value)}
                    style={{ background: '#0f111a', color: 'white', cursor: 'pointer' }}
                  >
                    <option value="online">🟢 Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="dnd">🔴 Do Not Disturb</option>
                    <option value="offline">⚪ Offline</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="prof-status-msg">Custom Status Message</label>
                <input
                  type="text"
                  id="prof-status-msg"
                  className="input-field"
                  placeholder="e.g. In a meeting / Focus mode"
                  value={profileStatusMsg}
                  onChange={(e) => setProfileStatusMsg(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>Profile Picture</label>
                
                {selectedImage ? (
                  /* Cropper Layout */
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)'
                  }} className="animate-fade">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Drag image to reposition • Zoom to fit</span>
                    
                    <canvas
                      ref={canvasRef}
                      width={200}
                      height={200}
                      onMouseDown={handleCropMouseDown}
                      onMouseMove={handleCropMouseMove}
                      onMouseUp={handleCropMouseUp}
                      onMouseLeave={handleCropMouseUp}
                      style={{
                        cursor: 'move',
                        borderRadius: '10px',
                        touchAction: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        background: '#0f111a'
                      }}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '240px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zoom:</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: 'var(--accent-primary)', height: '4px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '11px', color: 'white', minWidth: '30px' }}>{cropZoom.toFixed(2)}x</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={handleSaveCrop}
                        className="glow-btn"
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                      >
                        Crop & Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Selector & Preview */
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Current avatar preview */}
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: profileAvatarColor || '#6366f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '22px',
                      color: 'white',
                      overflow: 'hidden',
                      border: '2px solid var(--border-light)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      flexShrink: 0
                    }}>
                      {profileAvatarUrl ? (
                        <img src={profileAvatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        profileName ? profileName.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label 
                        className="glow-btn"
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        <Plus size={14} />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {presetAvatarUrls.map(preset => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setProfileAvatarUrl(preset.url)}
                            style={{
                              padding: '3px 6px',
                              background: profileAvatarUrl === preset.url ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                              border: '1px solid ' + (profileAvatarUrl === preset.url ? 'var(--accent-primary)' : 'var(--border-light)'),
                              borderRadius: '4px',
                              color: 'white',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            {preset.name}
                          </button>
                        ))}
                        {profileAvatarUrl && (
                          <button
                            type="button"
                            onClick={() => setProfileAvatarUrl('')}
                            style={{
                              padding: '3px 6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '4px',
                              color: '#fca5a5',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Theme Avatar Color (Default if no image URL)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', marginTop: '6px' }}>
                  {avatarColorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProfileAvatarColor(color)}
                      style={{
                        background: color,
                        height: '28px',
                        borderRadius: '6px',
                        border: profileAvatarColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: profileAvatarColor === color ? '0 0 10px ' + color : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="glow-btn modal-submit" disabled={loading} style={{ marginTop: '6px' }}>
                {loading ? <span className="loader"></span> : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Settings modal */}
      {showTeamModal && (
        <div className="modal-backdrop" style={{ zIndex: 100001 }}>
          <div className="modal-content-card glass-panel animate-fade" style={{ maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close-btn" onClick={() => setShowTeamModal(false)}>
              <X size={18} />
            </button>

            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Team Settings</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Only team admins can update the team profile and name.</p>
            </div>

            <div className="modal-divider"></div>

            {error && (
              <div className="modal-alert error animate-fade">
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="modal-alert success animate-fade">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeamProfile} className="modal-form" style={{ gap: '14px' }}>
              <div className="input-group">
                <label htmlFor="team-edit-name">Team Name</label>
                <input
                  type="text"
                  id="team-edit-name"
                  className="input-field"
                  value={teamEditName}
                  onChange={(e) => setTeamEditName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>Team Profile Picture</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: teamEditAvatarColor || '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '22px',
                    color: 'white',
                    overflow: 'hidden',
                    border: '2px solid var(--border-light)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                    flexShrink: 0
                  }}>
                    {teamEditAvatarUrl ? (
                      <img src={teamEditAvatarUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      teamEditName ? teamEditName.substring(0, 2).toUpperCase() : 'T'
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label 
                      className="glow-btn"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: 'none',
                        fontWeight: 600,
                        textAlign: 'center'
                      }}
                    >
                      <Plus size={14} />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleTeamPicChange}
                        style={{ display: 'none' }}
                        disabled={loading}
                      />
                    </label>
                    {teamEditAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setTeamEditAvatarUrl('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fca5a5',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: 0
                        }}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Or Choose Flat Color Theme</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#10b981', '#0ea5e9'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setTeamEditAvatarColor(color);
                        setTeamEditAvatarUrl('');
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: color,
                        border: teamEditAvatarColor === color ? '2px solid white' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-divider" style={{ margin: '10px 0' }}></div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glow-btn"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inCall && currentTeam && currentChannel && (
        <CallOverlay 
          socket={socket}
          teamId={currentTeam.id}
          channelId={currentChannel.id}
          channelName={currentChannel.name}
          currentUser={user}
          initialCallType={callType}
          onClose={() => setInCall(false)}
        />
      )}
        {showCameraModal && (
        <div className="modal-overlay" style={{ zIndex: 100002 }}>
          <div className="modal-content-card glass-panel" style={{ maxWidth: '480px', width: '100%', position: 'relative' }}>
            <div className="modal-header">
              <h2>Capture Snapshot</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button"
                  onClick={toggleChatCamera} 
                  className="close-modal-btn" 
                  title="Switch Camera (Front/Back)"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <RefreshCw size={18} />
                </button>
                <button type="button" onClick={stopCamera} className="close-modal-btn">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '100%', 
                aspectRatio: '4/3', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                background: 'black', 
                position: 'relative',
                border: '1px solid var(--border-light)' 
              }}>
                <video 
                  ref={cameraVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              {error && <p style={{ color: 'var(--error)', fontSize: '12px', margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!cameraStream}
                  style={{
                    flex: 2,
                    padding: '10px 14px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: cameraStream ? 1 : 0.6
                  }}
                >
                  <Camera size={16} />
                  Capture & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCodeModal && (
        <div className="modal-overlay" style={{ zIndex: 100003 }}>
          <div className="modal-content-card glass-panel" style={{ maxWidth: '640px', width: '100%', position: 'relative' }}>
            <div className="modal-header">
              <h2>Share Code Snippet</h2>
              <button onClick={() => setShowCodeModal(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSendCodeSnippet} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Language:</label>
                <select 
                  value={codeLanguage} 
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '6px 12px',
                    outline: 'none',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <textarea
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                placeholder="Paste or write your code snippet here..."
                style={{
                  width: '100%',
                  height: '240px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  padding: '12px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical'
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCodeModal(false)}
                  className="modal-action-btn secondary"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-action-btn primary"
                  style={{
                    background: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 20px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Share to Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Teams;

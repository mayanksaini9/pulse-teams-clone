import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const { token, user, setUser } = useAuth();
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [members, setMembers] = useState([]);
  
  // Real-time messages state (keyed by teamId_channelId)
  const [messages, setMessages] = useState({});
  const [socket, setSocket] = useState(null);

  // Fetch teams for the user
  const fetchTeams = async () => {
    if (!token) return;
    setLoadingTeams(true);
    try {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        
        // Auto-select first team if none is selected
        if (data.length > 0) {
          if (!currentTeam) {
            setCurrentTeam(data[0]);
            if (data[0].channels && data[0].channels.length > 0) {
              setCurrentChannel(data[0].channels[0]);
            }
          } else {
            const updatedActiveTeam = data.find(t => t.id === currentTeam.id);
            if (updatedActiveTeam) {
              setCurrentTeam(updatedActiveTeam);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  // Fetch team members list
  const fetchTeamMembers = async () => {
    if (!token || !currentTeam) return;
    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Connect/Disconnect Socket.io based on auth state
  useEffect(() => {
    if (token && user) {
      // Connect to server (proxy will route to 5000)
      const newSocket = io({
        auth: { token },
        autoConnect: true
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        newSocket.emit('user_connected', { userId: user.id });
      });

      newSocket.on('user_status_change', ({ userId, status }) => {
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, status, onlineStatus: status } : m));
      });

      // Handle real-time incoming messages
      newSocket.on('receive_message', (msg) => {
        const chatKey = `${msg.teamId}_${msg.channelId}`;
        setMessages(prev => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), msg]
        }));
      });

      // Handle real-time channel creation
      newSocket.on('channel_created', ({ teamId, channel }) => {
        setTeams(prevTeams => prevTeams.map(t => {
          if (t.id === teamId) {
            if (t.channels.some(c => c.id === channel.id)) return t;
            return { ...t, channels: [...t.channels, channel] };
          }
          return t;
        }));

        setCurrentTeam(prevCurrent => {
          if (prevCurrent && prevCurrent.id === teamId) {
            if (prevCurrent.channels.some(c => c.id === channel.id)) return prevCurrent;
            return { ...prevCurrent, channels: [...prevCurrent.channels, channel] };
          }
          return prevCurrent;
        });
      });

      // Handle user profile updates across other sessions
      newSocket.on('user_profile_updated', (updatedUser) => {
        setMembers(prev => prev.map(m => m.id === updatedUser.id ? { ...m, ...updatedUser } : m));
        // If current user is updated, refresh local auth user context
        if (updatedUser.id === user.id) {
          setUser(updatedUser);
        }
      });

      // Handle team updates across other sessions
      newSocket.on('team_updated', ({ teamId }) => {
        fetchTeams();
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      fetchTeams();

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else {
      setTeams([]);
      setCurrentTeam(null);
      setCurrentChannel(null);
      setMessages({});
      setMembers([]);
    }
  }, [token, user]);

  // Subscribe to team notifications room and load members
  useEffect(() => {
    if (!socket || !currentTeam) return;

    socket.emit('join_team', { teamId: currentTeam.id });
    fetchTeamMembers();

    const handleConnect = () => {
      socket.emit('join_team', { teamId: currentTeam.id });
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.emit('leave_team', { teamId: currentTeam.id });
    };
  }, [socket, currentTeam]);

  // Handle room joining/leaving when channel changes
  useEffect(() => {
    if (!socket || !currentTeam || !currentChannel) return;

    // Join the room if socket is already connected
    if (socket.connected) {
      socket.emit('join_channel', { 
        teamId: currentTeam.id, 
        channelId: currentChannel.id 
      });
    }

    // Auto-rejoin room on connection restore
    const handleConnect = () => {
      socket.emit('join_channel', { 
        teamId: currentTeam.id, 
        channelId: currentChannel.id 
      });
    };

    socket.on('connect', handleConnect);

    // Fetch message history for this channel
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/teams/${currentTeam.id}/channels/${currentChannel.id}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const history = await response.json();
          const chatKey = `${currentTeam.id}_${currentChannel.id}`;
          setMessages(prev => ({
            ...prev,
            [chatKey]: history
          }));
        }
      } catch (err) {
        console.error('Error fetching message history:', err);
      }
    };

    fetchHistory();

    // Cleanup: leave the room before switching or when socket changes
    return () => {
      socket.off('connect', handleConnect);
      if (socket.connected) {
        socket.emit('leave_channel', { 
          teamId: currentTeam.id, 
          channelId: currentChannel.id 
        });
      }
    };
  }, [socket, currentTeam, currentChannel, token]);

  // Create team handler
  const createNewTeam = async (name, passcode) => {
    try {
      const response = await fetch('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, passcode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create team.');
      }
      
      setTeams(prev => [...prev, data]);
      setCurrentTeam(data);
      if (data.channels && data.channels.length > 0) {
        setCurrentChannel(data.channels[0]);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Join team handler
  const joinExistingTeam = async (teamId, passcode) => {
    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamId, passcode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to join team.');
      }

      setTeams(prev => [...prev, data]);
      setCurrentTeam(data);
      if (data.channels && data.channels.length > 0) {
        setCurrentChannel(data.channels[0]);
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Create Channel helper
  const createChannel = async (name, description) => {
    if (!token || !currentTeam) return;
    try {
      const response = await fetch(`/api/teams/${currentTeam.id}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create channel.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Send message helper (emits to server)
  const sendMessage = (text, isMedia = false, isAttachment = false, replyTo = null, type = 'text', attachment = null) => {
    if (!socket || !currentTeam || !currentChannel || !user) return;

    socket.emit('send_message', {
      teamId: currentTeam.id,
      channelId: currentChannel.id,
      text: text.trim(),
      senderId: user.id,
      senderName: user.name,
      senderAvatarColor: user.avatarColor || '#6366f1',
      senderAvatarUrl: user.avatarUrl || '',
      isMedia: !!isMedia,
      isAttachment: !!isAttachment,
      replyTo: replyTo,
      type: type,
      attachment: attachment
    });
  };

  const selectTeam = (team) => {
    setCurrentTeam(team);
    if (team && team.channels && team.channels.length > 0) {
      setCurrentChannel(team.channels[0]);
    } else {
      setCurrentChannel(null);
    }
  };

  const leaveTeam = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const remainingTeams = teams.filter(t => t.id !== teamId);
        setTeams(remainingTeams);
        
        if (currentTeam && currentTeam.id === teamId) {
          if (remainingTeams.length > 0) {
            setCurrentTeam(remainingTeams[0]);
            if (remainingTeams[0].channels && remainingTeams[0].channels.length > 0) {
              setCurrentChannel(remainingTeams[0].channels[0]);
            } else {
              setCurrentChannel(null);
            }
          } else {
            setCurrentTeam(null);
            setCurrentChannel(null);
          }
        }
        return true;
      } else {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to leave team.');
      }
    } catch (error) {
      console.error('Error in leaveTeam client:', error);
      throw error;
    }
  };

  return (
    <TeamContext.Provider value={{
      teams,
      currentTeam,
      currentChannel,
      loadingTeams,
      messages,
      members,
      fetchTeams,
      createNewTeam,
      joinExistingTeam,
      createChannel,
      sendMessage,
      leaveTeam,
      socket,
      setCurrentTeam: selectTeam,
      setCurrentChannel
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
};

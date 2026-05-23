const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const database = require('./database');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse-teams';
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    if (process.env.RESET_DB === 'true') {
      console.log('RESET_DB=true detected. Wiping MongoDB database collections...');
      try {
        await mongoose.connection.db.dropDatabase();
        console.log('MongoDB database wiped successfully.');
      } catch (dropErr) {
        console.error('Failed to wipe MongoDB database:', dropErr);
      }
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Ensure MongoDB is installed and running locally, or supply MONGODB_URI.');
  });

// Also reset local files if requested
if (process.env.RESET_DB === 'true') {
  console.log('RESET_DB=true detected. Wiping local JSON database files...');
  const resetFiles = ['users.json', 'teams.json', 'messages.json'];
  const fs = require('fs');
  resetFiles.forEach(file => {
    const filePath = path.join(__dirname, 'data', file);
    try {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      console.log(`Wiped local file: ${file}`);
    } catch (e) {
      console.error(`Failed to wipe local file: ${file}`, e);
    }
  });
}

// Environment variables
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pulse_teams_super_secret_key_2026';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());

// Search GIFs proxy endpoint
app.get('/api/gifs/search', async (req, res) => {
  const query = req.query.q || '';
  if (!query) {
    return res.json([]);
  }
  
  // List of Giphy keys to try in fallback order
  const keys = [
    '3eP2Alml557CgSRGseLtTJz29824q4iZ', // React SDK public key
    '0UTRbFco6AZLBWOCy87zG96s4f4r39V3', // Giphy Android SDK Key
    'dc6zaTOxFJmzC',                   // Legacy key
    'LiyvJg9tGxV4ZFi78V1b2n3x2S1Fw92D'
  ];

  for (const key of keys) {
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=16&rating=g`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
          const formatted = data.data.map(g => ({
            name: g.title,
            url: g.images.fixed_height.url
          }));
          return res.json(formatted);
        }
      }
    } catch (e) {
      console.warn(`GIPHY API failed with key ${key}:`, e.message);
    }
  }

  // If GIPHY keys fail, query public Tenor API (which does not require a key for basic search endpoints or has public keys)
  try {
    const tenorRes = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDTRZGLBI2&limit=16`);
    if (tenorRes.ok) {
      const data = await tenorRes.json();
      if (data && data.results && data.results.length > 0) {
        const formatted = data.results.map(g => ({
          name: g.title || 'Tenor GIF',
          url: g.media[0].gif.url
        }));
        return res.json(formatted);
      }
    }
  } catch (e) {
    console.warn('Tenor API fallback failed:', e.message);
  }

  // Final fallback: empty array
  res.json([]);
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token.' });
  }
};

// --- AUTHENTICATION ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    // Validate password complexity: min 8 char with number and special sign
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-\[\]\\\/~`;]/.test(password);
    if (password.length < 8 || !hasNumber || !hasSpecial) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain at least one number and one special character.' 
      });
    }

    // Check if user already exists
    const existingUser = await database.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await database.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatarColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    });

    res.status(201).json({
      requireVerification: true,
      email: newUser.email,
      message: 'Account created. A 6-digit verification code has been printed to the server console.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Verify Email
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const verifiedUser = await database.verifyUserEmail(email, code);

    // Generate JWT token
    const token = jwt.sign({ id: verifiedUser.id, name: verifiedUser.name, email: verifiedUser.email }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, verificationToken: __, ...userWithoutPassword } = verifiedUser;
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({ message: error.message || 'Verification failed.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    // Check user exists
    const user = await database.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Enforce email verification check
    if (!user.verified) {
      return res.status(400).json({
        requireVerification: true,
        email: user.email,
        message: 'Please verify your email before logging in.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Respond (excluding password)
    const { password: _, verificationToken: __, ...userWithoutPassword } = user;
    res.status(200).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await database.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { password: _, verificationToken: __, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});


// --- TEAM ROUTES ---

// Create a Team
app.post('/api/teams/create', authenticateToken, async (req, res) => {
  try {
    const { name, passcode } = req.body;

    if (!name || !passcode) {
      return res.status(400).json({ message: 'Team name and passcode are required.' });
    }

    const newTeam = await database.createTeam({
      name,
      passcode,
      creatorId: req.user.id
    });

    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error creating team.' });
  }
});

// Join a Team
app.post('/api/teams/join', authenticateToken, async (req, res) => {
  try {
    const { teamId, passcode } = req.body;

    if (!teamId || !passcode) {
      return res.status(400).json({ message: 'Team ID and passcode are required.' });
    }

    const team = await database.joinTeam(teamId.toUpperCase().trim(), passcode.trim(), req.user.id);
    res.status(200).json(team);
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(400).json({ message: error.message || 'Error joining team.' });
  }
});

// Join a Team via Invite Link (Bypasses Passcode)
app.post('/api/teams/:teamId/join-invite', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await database.findTeamById(teamId.toUpperCase().trim());
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }

    if (team.members.includes(userId)) {
      return res.status(200).json({ team, message: 'Already a member.' });
    }

    team.members.push(userId);
    await database.updateTeam(team);

    res.status(200).json({ team, message: `Successfully joined ${team.name}!` });
  } catch (error) {
    console.error('Error joining team via invite:', error);
    res.status(500).json({ message: 'Server error joining team via invite.' });
  }
});

// Leave a Team
app.post('/api/teams/:teamId/leave', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await database.leaveTeam(teamId, req.user.id);
    res.status(200).json({ message: 'Successfully left the team.', teamId });
  } catch (error) {
    console.error('Error leaving team:', error);
    res.status(400).json({ message: error.message || 'Error leaving team.' });
  }
});

// Get User's Teams
app.get('/api/teams', authenticateToken, async (req, res) => {
  try {
    const userTeams = await database.findTeamsForUser(req.user.id);
    res.status(200).json(userTeams);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ message: 'Server error fetching teams.' });
  }
});

// Get Channel Messages
app.get('/api/teams/:teamId/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { teamId, channelId } = req.params;
    
    // Verify member permissions
    const team = await database.findTeamById(teamId);
    if (!team || !team.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden. You are not a member of this team.' });
    }
    
    const messages = await database.getMessages(teamId, channelId);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages.' });
  }
});

// Get Team Members
app.get('/api/teams/:teamId/members', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await database.findTeamById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden. You are not a member of this team.' });
    }
    const members = await database.getTeamMembers(teamId);
    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Server error fetching team members.' });
  }
});

// Create Channel in Team
app.post('/api/teams/:teamId/channels', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Channel name is required.' });
    }

    const team = await database.findTeamById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found.' });
    }
    if (!team.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden. You are not a member of this team.' });
    }

    const newChannel = await database.createChannel(teamId, name, description);
    
    // Broadcast to team room via Socket.io
    io.to(teamId).emit('channel_created', { teamId, channel: newChannel });

    res.status(201).json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(400).json({ message: error.message || 'Server error creating channel.' });
  }
});

// Get Active Calls for a Team
app.get('/api/teams/:teamId/active-calls', authenticateToken, (req, res) => {
  try {
    const { teamId } = req.params;
    const activeList = Object.keys(activeCalls)
      .filter(cId => activeCalls[cId].teamId === teamId)
      .map(cId => ({
        channelId: cId,
        callType: activeCalls[cId].callType,
        userName: activeCalls[cId].userName
      }));
    res.status(200).json(activeList);
  } catch (error) {
    console.error('Error fetching active calls:', error);
    res.status(500).json({ message: 'Server error fetching active calls.' });
  }
});

// Update User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, avatarColor, statusMessage, onlineStatus, avatarUrl, phone, jobTitle, department } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatarColor) updateData.avatarColor = avatarColor;
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;
    if (onlineStatus) updateData.onlineStatus = onlineStatus;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (phone !== undefined) updateData.phone = phone;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (department !== undefined) updateData.department = department;

    const updatedUser = await database.updateUser(req.user.id, updateData);
    const { password, ...safeUser } = updatedUser;
    
    // Broadcast user profile updates
    io.emit('user_profile_updated', safeUser);

    res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ message: error.message || 'Server error updating profile.' });
  }
});


// --- REALTIME SOCKET.IO SETUP ---
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const activeCalls = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a team room
  socket.on('join_team', ({ teamId }) => {
    socket.join(teamId);
    console.log(`Socket ${socket.id} joined team room: ${teamId}`);
  });

  // Leave a team room
  socket.on('leave_team', ({ teamId }) => {
    socket.leave(teamId);
    console.log(`Socket ${socket.id} left team room: ${teamId}`);
  });

  // Join a channel room
  socket.on('join_channel', ({ teamId, channelId }) => {
    const roomName = `${teamId}_${channelId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // Leave a channel room
  socket.on('leave_channel', ({ teamId, channelId }) => {
    const roomName = `${teamId}_${channelId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  // Handle incoming message and broadcast to others in room
  socket.on('send_message', async (messageData) => {
    try {
      const { teamId, channelId, text, senderId, senderName, senderAvatarColor, senderAvatarUrl, isMedia, isAttachment } = messageData;
      
      if (!teamId || !channelId || !text || !senderId) {
        return;
      }
      
      const newMsg = await database.createMessage({
        teamId,
        channelId,
        text,
        senderId,
        senderName,
        senderAvatarColor,
        senderAvatarUrl: senderAvatarUrl || '',
        isMedia: !!isMedia,
        isAttachment: !!isAttachment
      });
      
      const roomName = `${teamId}_${channelId}`;
      io.to(roomName).emit('receive_message', newMsg);
    } catch (err) {
      console.error('Socket error in send_message:', err);
    }
  });

  // --- WEBRTC CALL SIGNALING & NOTIFICATIONS ---

  socket.on('start_call', ({ teamId, channelId, channelName, userName, callType }) => {
    activeCalls[channelId] = {
      teamId,
      channelId,
      channelName,
      userName,
      callType,
      screenSharer: null,
      participants: [socket.id]
    };

    const teamChannelRoom = `${teamId}_${channelId}`;
    // Broadcast incoming call event to everyone else in this channel
    socket.to(teamChannelRoom).emit('incoming_call', {
      teamId,
      channelId,
      channelName,
      userName,
      callType,
      callerSocketId: socket.id
    });

    // Notify everyone in the team of active call update
    const activeList = Object.keys(activeCalls)
      .filter(cId => activeCalls[cId].teamId === teamId)
      .map(cId => ({
        channelId: cId,
        callType: activeCalls[cId].callType,
        userName: activeCalls[cId].userName
      }));
    io.to(teamId).emit('active_calls_update', activeList);

    console.log(`Call notification sent for room: ${teamChannelRoom} (Type: ${callType})`);
  });
  
  socket.on('join_call_room', ({ teamId, channelId, userName, userAvatarColor, userAvatarUrl }) => {
    const callRoomName = `call_${teamId}_${channelId}`;
    socket.join(callRoomName);
    
    // Track participant socket
    if (!activeCalls[channelId]) {
      activeCalls[channelId] = {
        teamId,
        channelId,
        channelName: 'Channel Meeting',
        userName,
        callType: 'video',
        screenSharer: null,
        participants: []
      };
    }
    if (!activeCalls[channelId].participants.includes(socket.id)) {
      activeCalls[channelId].participants.push(socket.id);
    }

    // Get all other participants in the call room
    const clients = io.sockets.adapter.rooms.get(callRoomName);
    const otherUsers = [];
    if (clients) {
      clients.forEach((clientId) => {
        if (clientId !== socket.id) {
          otherUsers.push(clientId);
        }
      });
    }
    
    // Notify the joining user of other participants
    socket.emit('call_room_users', otherUsers);
    
    // Broadcast to others in the room that a new user joined
    socket.to(callRoomName).emit('user_joined_call', {
      socketId: socket.id,
      userName,
      userAvatarColor,
      userAvatarUrl
    });

    // Check if there is an active screen sharer in the room already
    if (activeCalls[channelId] && activeCalls[channelId].screenSharer) {
      socket.emit('screen_share_owner', {
        ownerSocketId: activeCalls[channelId].screenSharer.socketId,
        ownerName: activeCalls[channelId].screenSharer.userName
      });
    }

    // Notify everyone in the team of active call update
    const activeList = Object.keys(activeCalls)
      .filter(cId => activeCalls[cId].teamId === teamId)
      .map(cId => ({
        channelId: cId,
        callType: activeCalls[cId].callType,
        userName: activeCalls[cId].userName
      }));
    io.to(teamId).emit('active_calls_update', activeList);
    
    console.log(`Socket ${socket.id} joined call room: ${callRoomName}`);
  });

  socket.on('send_call_signal', ({ targetSocketId, senderName, senderAvatarColor, signal }) => {
    io.to(targetSocketId).emit('receive_call_signal', {
      senderSocketId: socket.id,
      senderName,
      senderAvatarColor,
      signal
    });
  });

  socket.on('share_screen_started', ({ teamId, channelId, userName }) => {
    const callRoomName = `call_${teamId}_${channelId}`;
    if (activeCalls[channelId]) {
      activeCalls[channelId].screenSharer = { socketId: socket.id, userName };
    }
    socket.to(callRoomName).emit('screen_share_owner', {
      ownerSocketId: socket.id,
      ownerName: userName
    });
    console.log(`Screen share started in channel ${channelId} by ${userName} (Socket: ${socket.id})`);
  });

  socket.on('share_screen_stopped', ({ teamId, channelId }) => {
    const callRoomName = `call_${teamId}_${channelId}`;
    if (activeCalls[channelId] && activeCalls[channelId].screenSharer?.socketId === socket.id) {
      activeCalls[channelId].screenSharer = null;
    }
    io.to(callRoomName).emit('screen_share_cleared');
    console.log(`Screen share cleared in channel ${channelId}`);
  });

  socket.on('leave_call_room', ({ teamId, channelId }) => {
    const callRoomName = `call_${teamId}_${channelId}`;
    socket.leave(callRoomName);
    
    // If the leaving user was screen sharing, clean it up
    if (activeCalls[channelId] && activeCalls[channelId].screenSharer?.socketId === socket.id) {
      activeCalls[channelId].screenSharer = null;
      socket.to(callRoomName).emit('screen_share_cleared');
    }

    if (activeCalls[channelId]) {
      activeCalls[channelId].participants = activeCalls[channelId].participants.filter(id => id !== socket.id);
      if (activeCalls[channelId].participants.length === 0) {
        delete activeCalls[channelId];
      }
    }

    socket.to(callRoomName).emit('user_left_call', { socketId: socket.id });
    
    // Notify everyone in the team of active call update
    const activeList = Object.keys(activeCalls)
      .filter(cId => activeCalls[cId].teamId === teamId)
      .map(cId => ({
        channelId: cId,
        callType: activeCalls[cId].callType,
        userName: activeCalls[cId].userName
      }));
    io.to(teamId).emit('active_calls_update', activeList);

    console.log(`Socket ${socket.id} left call room: ${callRoomName}`);
  });

  socket.on('get_active_calls', ({ teamId }) => {
    const activeList = Object.keys(activeCalls)
      .filter(cId => activeCalls[cId].teamId === teamId)
      .map(cId => ({
        channelId: cId,
        callType: activeCalls[cId].callType,
        userName: activeCalls[cId].userName
      }));
    socket.emit('active_calls_update', activeList);
  });

  socket.on('disconnect', () => {
    // Notify all rooms the socket was in that they left calls
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (room.startsWith('call_')) {
        const parts = room.split('_');
        const channelId = parts.slice(2).join('_');
        
        if (activeCalls[channelId] && activeCalls[channelId].screenSharer?.socketId === socket.id) {
          activeCalls[channelId].screenSharer = null;
          socket.to(room).emit('screen_share_cleared');
        }

        socket.to(room).emit('user_left_call', { socketId: socket.id });
        
        if (activeCalls[channelId]) {
          activeCalls[channelId].participants = activeCalls[channelId].participants.filter(id => id !== socket.id);
          const teamId = activeCalls[channelId].teamId;
          if (activeCalls[channelId].participants.length === 0) {
            delete activeCalls[channelId];
          }
          const activeList = Object.keys(activeCalls)
            .filter(cId => activeCalls[cId].teamId === teamId)
            .map(cId => ({
              channelId: cId,
              callType: activeCalls[cId].callType,
              userName: activeCalls[cId].userName
            }));
          io.to(teamId).emit('active_calls_update', activeList);
        }
      }
    });
    console.log('User disconnected:', socket.id);
  });
});

// Serve frontend in production (optional, we'll keep dev server for now)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

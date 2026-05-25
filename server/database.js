const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
if (process.env.MONGODB_URI) {
  process.env.MONGODB_URI = process.env.MONGODB_URI.trim();
}
const { sendVerificationEmail } = require('./email');

// --- JSON File Fallback Setup ---
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (fileName) => path.join(DATA_DIR, `${fileName}.json`);

const readData = (fileName) => {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading database file: ${fileName}`, err);
    return [];
  }
};

const writeData = (fileName, data) => {
  const filePath = getFilePath(fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing database file: ${fileName}`, err);
  }
};

// --- MongoDB / Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  avatarColor: { type: String, default: '#6366f1' },
  avatarUrl: { type: String, default: '' },
  status: { type: String, default: 'online' },
  statusMsg: { type: String, default: '' },
  phone: { type: String, default: '' },
  jobTitle: { type: String, default: '' },
  department: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TeamSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  passcode: { type: String, required: true },
  creatorId: { type: String, required: true },
  admins: [{ type: String }],
  theme: { type: String, default: 'default' },
  avatarUrl: { type: String, default: '' },
  avatarColor: { type: String, default: '#6366f1' },
  members: [{ type: String }],
  channels: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  teamId: { type: String, required: true },
  channelId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatarColor: { type: String, default: '#6366f1' },
  senderAvatarUrl: { type: String, default: '' },
  text: { type: String, default: '' },
  type: { type: String, default: 'text' },
  attachment: { type: mongoose.Schema.Types.Mixed },
  isSystem: { type: Boolean, default: false },
  isMedia: { type: Boolean, default: false },
  isAttachment: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  replyTo: { type: mongoose.Schema.Types.Mixed, default: null }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

const PwaStatsSchema = new mongoose.Schema({
  key: { type: String, default: 'install_count', unique: true },
  count: { type: Number, default: 0 }
});
const PwaStats = mongoose.models.PwaStats || mongoose.model('PwaStats', PwaStatsSchema);

// Helper to determine if we should use MongoDB or JSON files
const isMongoConnected = () => {
  // If explicitly configured with MONGODB_URI (e.g. in production), we MUST use MongoDB
  // so Mongoose buffers operations properly instead of falling back to ephemeral files.
  if (process.env.MONGODB_URI) {
    return true;
  }
  // Otherwise, only use MongoDB if it is fully connected (readyState 1)
  return mongoose.connection.readyState === 1;
};

const normalizeUser = (u) => {
  if (!u) return null;
  const userObj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  if (!userObj.id && userObj._id) {
    userObj.id = userObj._id.toString();
  }
  return userObj;
};

const normalizeTeam = (t) => {
  if (!t) return null;
  const teamObj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
  if (!teamObj.id && teamObj._id) {
    teamObj.id = teamObj._id.toString();
  }
  if (teamObj.members) {
    teamObj.members = teamObj.members.map(m => m.toString());
  }
  if (teamObj.admins) {
    teamObj.admins = teamObj.admins.map(m => m.toString());
  }
  if (teamObj.creatorId) {
    teamObj.creatorId = teamObj.creatorId.toString();
  }
  return teamObj;
};

const normalizeMessage = (m) => {
  if (!m) return null;
  const msgObj = typeof m.toObject === 'function' ? m.toObject() : { ...m };
  if (!msgObj.id && msgObj._id) {
    msgObj.id = msgObj._id.toString();
  }
  if (msgObj.senderId) {
    msgObj.senderId = msgObj.senderId.toString();
  }
  return msgObj;
};

const database = {
  getUsers: async () => {
    if (isMongoConnected()) {
      const users = await User.find({}).lean();
      return users.map(normalizeUser);
    } else {
      return readData('users').map(normalizeUser);
    }
  },
  
  findUserByEmail: async (email) => {
    if (!email) return null;
    if (isMongoConnected()) {
      const user = await User.findOne({ email: email.toLowerCase() }).lean();
      return normalizeUser(user);
    } else {
      const users = readData('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      return normalizeUser(user);
    }
  },

  findUserById: async (id) => {
    if (!id) return null;
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
      const user = await User.findOne(query).lean();
      return normalizeUser(user);
    } else {
      const users = readData('users');
      const user = users.find(u => u.id === id || u._id === id) || null;
      return normalizeUser(user);
    }
  },

  createUser: async (userData) => {
    const isAlreadyVerified = userData.verified === true;
    const verificationToken = isAlreadyVerified ? '' : Math.floor(100000 + Math.random() * 900000).toString();
    const cleanEmail = userData.email.toLowerCase();
    
    if (!isAlreadyVerified) {
      sendVerificationEmail(cleanEmail, verificationToken).catch(err => {
        console.error('Failed to send verification email in background:', err);
      });
    }

    if (isMongoConnected()) {
      const newUser = new User({
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        email: cleanEmail,
        verified: isAlreadyVerified,
        verificationToken
      });
      await newUser.save();
      return normalizeUser(newUser.toObject());
    } else {
      const users = readData('users');
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        email: cleanEmail,
        avatarColor: userData.avatarColor || '#6366f1',
        avatarUrl: '',
        status: 'online',
        statusMsg: '',
        phone: '',
        jobTitle: '',
        department: '',
        verified: isAlreadyVerified,
        verificationToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      writeData('users', users);
      return normalizeUser(newUser);
    }
  },

  verifyUserEmail: async (email, token) => {
    const cleanEmail = email.toLowerCase();
    if (isMongoConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        throw new Error('User not found.');
      }
      if (user.verificationToken !== token) {
        throw new Error('Invalid verification code.');
      }
      user.verified = true;
      user.verificationToken = '';
      await user.save();
      return normalizeUser(user.toObject());
    } else {
      const users = readData('users');
      const userIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (userIndex === -1) {
        throw new Error('User not found.');
      }
      if (users[userIndex].verificationToken !== token) {
        throw new Error('Invalid verification code.');
      }
      users[userIndex].verified = true;
      users[userIndex].verificationToken = '';
      writeData('users', users);
      return normalizeUser(users[userIndex]);
    }
  },

  getTeams: async () => {
    if (isMongoConnected()) {
      const teams = await Team.find({}).lean();
      return teams.map(normalizeTeam);
    } else {
      return readData('teams').map(normalizeTeam);
    }
  },
  
  findTeamById: async (id) => {
    if (!id) return null;
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
      const team = await Team.findOne(query).lean();
      if (team) {
        if (!team.admins || team.admins.length === 0) team.admins = [team.creatorId];
        if (!team.theme) team.theme = 'default';
      }
      return normalizeTeam(team);
    } else {
      const teams = readData('teams');
      const team = teams.find(t => t.id === id || t._id === id) || null;
      if (team) {
        if (!team.admins || team.admins.length === 0) team.admins = [team.creatorId];
        if (!team.theme) team.theme = 'default';
      }
      return normalizeTeam(team);
    }
  },

  findTeamsForUser: async (userId) => {
    if (!userId) return [];
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(userId)
        ? { $or: [{ members: userId }, { members: new mongoose.Types.ObjectId(userId) }] }
        : { members: userId };
      const teams = await Team.find(query).lean();
      return teams.map(t => {
        if (!t.admins || t.admins.length === 0) t.admins = [t.creatorId];
        if (!t.theme) t.theme = 'default';
        return normalizeTeam(t);
      });
    } else {
      const teams = readData('teams');
      return teams.filter(t => t.members.includes(userId)).map(t => {
        if (!t.admins || t.admins.length === 0) t.admins = [t.creatorId];
        if (!t.theme) t.theme = 'default';
        return normalizeTeam(t);
      });
    }
  },
  
  createTeam: async (teamData) => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const teamId = `PULSE-${randomCode}`;
    const channels = [
      { id: 'general', name: 'general', description: 'Company-wide announcements and work-based discussions' },
      { id: 'random', name: 'random', description: 'Non-work talk and banter' }
    ];

    if (isMongoConnected()) {
      const newTeam = new Team({
        id: teamId,
        name: teamData.name,
        passcode: teamData.passcode,
        creatorId: teamData.creatorId,
        admins: [teamData.creatorId],
        theme: 'default',
        members: [teamData.creatorId],
        channels
      });
      await newTeam.save();
      return normalizeTeam(newTeam.toObject());
    } else {
      const teams = readData('teams');
      const newTeam = {
        id: teamId,
        name: teamData.name,
        passcode: teamData.passcode,
        creatorId: teamData.creatorId,
        admins: [teamData.creatorId],
        theme: 'default',
        members: [teamData.creatorId],
        channels,
        createdAt: new Date().toISOString()
      };
      teams.push(newTeam);
      writeData('teams', teams);
      return normalizeTeam(newTeam);
    }
  },

  joinTeam: async (teamId, passcode, userId) => {
    if (!teamId || !userId) throw new Error('Team ID and User ID are required');
    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId });
      if (!team) throw new Error('Team not found. Please verify the Team ID.');
      if (team.passcode !== passcode) throw new Error('Incorrect passcode. Please try again.');
      
      const normalizedTeam = normalizeTeam(team.toObject());
      if (normalizedTeam.members.includes(userId)) throw new Error('You are already a member of this team.');
      
      team.members.push(userId);
      await team.save();
      return normalizeTeam(team.toObject());
    } else {
      const teams = readData('teams');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error('Team not found. Please verify the Team ID.');
      
      const team = teams[teamIndex];
      if (team.passcode !== passcode) throw new Error('Incorrect passcode. Please try again.');
      
      const normalizedTeam = normalizeTeam(team);
      if (normalizedTeam.members.includes(userId)) throw new Error('You are already a member of this team.');
      
      team.members.push(userId);
      teams[teamIndex] = team;
      writeData('teams', teams);
      return normalizeTeam(team);
    }
  },

  leaveTeam: async (teamId, userId) => {
    if (!teamId || !userId) throw new Error('Team ID and User ID are required');
    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId });
      if (!team) throw new Error('Team not found.');
      
      const normalizedTeam = normalizeTeam(team.toObject());
      if (!normalizedTeam.members.includes(userId)) throw new Error('You are not a member of this team.');
      
      team.members = team.members.filter(m => m.toString() !== userId.toString());
      if (team.members.length === 0) {
        await Team.deleteOne({ id: teamId });
        return null;
      } else {
        if (team.creatorId.toString() === userId.toString()) {
          team.creatorId = team.members[0];
        }
        await team.save();
      }
      return normalizeTeam(team.toObject());
    } else {
      const teams = readData('teams');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error('Team not found.');
      
      const team = teams[teamIndex];
      const normalizedTeam = normalizeTeam(team);
      if (!normalizedTeam.members.includes(userId)) throw new Error('You are not a member of this team.');
      
      team.members = team.members.filter(m => m.toString() !== userId.toString());
      if (team.members.length === 0) {
        teams.splice(teamIndex, 1);
        writeData('teams', teams);
        return null;
      } else {
        if (team.creatorId.toString() === userId.toString()) {
          team.creatorId = team.members[0];
        }
        teams[teamIndex] = team;
        writeData('teams', teams);
      }
      return normalizeTeam(team);
    }
  },

  updateTeam: async (updatedTeam) => {
    if (isMongoConnected()) {
      const result = await Team.updateOne({ id: updatedTeam.id }, { $set: updatedTeam });
      return result.modifiedCount > 0;
    } else {
      const teams = readData('teams');
      const index = teams.findIndex(t => t.id === updatedTeam.id);
      if (index !== -1) {
        teams[index] = updatedTeam;
        writeData('teams', teams);
        return true;
      }
      return false;
    }
  },

  getMessages: async (teamId, channelId) => {
    if (isMongoConnected()) {
      const messages = await Message.find({ teamId, channelId }).sort({ timestamp: 1 }).lean();
      return messages.map(normalizeMessage);
    } else {
      const messages = readData('messages');
      return messages.filter(m => m.teamId === teamId && m.channelId === channelId).map(normalizeMessage);
    }
  },

  createMessage: async (messageData) => {
    if (isMongoConnected()) {
      const newMsg = new Message({
        id: Math.random().toString(36).substr(2, 9),
        ...messageData
      });
      await newMsg.save();
      return normalizeMessage(newMsg.toObject());
    } else {
      const messages = readData('messages');
      const newMsg = {
        id: Math.random().toString(36).substr(2, 9),
        ...messageData,
        timestamp: new Date().toISOString()
      };
      messages.push(newMsg);
      writeData('messages', messages);
      return normalizeMessage(newMsg);
    }
  },

  createChannel: async (teamId, channelName, description) => {
    const channelId = channelName.toLowerCase().replace(/\s+/g, '-').trim();

    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId });
      if (!team) throw new Error('Team not found');
      if (team.channels.some(c => c.id === channelId)) {
        throw new Error('Channel already exists');
      }
      
      const newChannel = { id: channelId, name: channelName.toLowerCase().trim(), description: description || '' };
      team.channels.push(newChannel);
      await team.save();
      return newChannel;
    } else {
      const teams = readData('teams');
      const index = teams.findIndex(t => t.id === teamId);
      if (index === -1) throw new Error('Team not found');
      if (teams[index].channels.some(c => c.id === channelId)) {
        throw new Error('Channel already exists');
      }
      
      const newChannel = { id: channelId, name: channelName.toLowerCase().trim(), description: description || '' };
      teams[index].channels.push(newChannel);
      writeData('teams', teams);
      return newChannel;
    }
  },

  updateUser: async (userId, updateData) => {
    if (!userId) throw new Error('User ID is required');
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(userId) ? { $or: [{ id: userId }, { _id: userId }] } : { id: userId };
      const user = await User.findOne(query);
      if (!user) throw new Error('User not found');
      Object.assign(user, updateData, { updatedAt: new Date() });
      await user.save();
      return normalizeUser(user.toObject());
    } else {
      const users = readData('users');
      const index = users.findIndex(u => u.id === userId || u._id === userId);
      if (index === -1) throw new Error('User not found');
      
      users[index] = {
        ...users[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeData('users', users);
      return normalizeUser(users[index]);
    }
  },

  getTeamMembers: async (teamId) => {
    if (!teamId) return [];
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(teamId) ? { $or: [{ id: teamId }, { _id: teamId }] } : { id: teamId };
      const team = await Team.findOne(query).lean();
      if (!team) return [];
      const normalizedTeam = normalizeTeam(team);
      const validObjectIds = normalizedTeam.members.filter(m => mongoose.Types.ObjectId.isValid(m));
      const membersQuery = [
        { id: { $in: normalizedTeam.members } }
      ];
      if (validObjectIds.length > 0) {
        membersQuery.push({ _id: { $in: validObjectIds } });
        membersQuery.push({ _id: { $in: validObjectIds.map(id => new mongoose.Types.ObjectId(id)) } });
      }
      const users = await User.find({ $or: membersQuery }).lean();
      return users.map(u => {
        const { password, verificationToken, ...safeUser } = normalizeUser(u);
        return safeUser;
      });
    } else {
      const teams = readData('teams');
      const team = teams.find(t => t.id === teamId || t._id === teamId);
      if (!team) return [];
      const normalizedTeam = normalizeTeam(team);
      const users = readData('users');
      return users
        .filter(u => normalizedTeam.members.includes(u.id) || normalizedTeam.members.includes(u._id))
        .map(u => {
          const { password, verificationToken, ...safeUser } = normalizeUser(u);
          return safeUser;
        });
    }
  },

  incrementPwaInstallCount: async () => {
    if (isMongoConnected()) {
      await PwaStats.updateOne(
        { key: 'install_count' },
        { $inc: { count: 1 } },
        { upsert: true }
      );
      const doc = await PwaStats.findOne({ key: 'install_count' }).lean();
      return doc ? doc.count : 1;
    } else {
      const stats = readData('stats');
      let installObj = stats.find(s => s.key === 'install_count');
      if (!installObj) {
        installObj = { key: 'install_count', count: 0 };
        stats.push(installObj);
      }
      installObj.count += 1;
      writeData('stats', stats);
      return installObj.count;
    }
  },
  
  findMessageById: async (id) => {
    if (!id) return null;
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
      const msg = await Message.findOne(query).lean();
      return normalizeMessage(msg);
    } else {
      const messages = readData('messages');
      const msg = messages.find(m => m.id === id || m._id === id);
      return normalizeMessage(msg);
    }
  },

  deleteMessage: async (messageId) => {
    if (!messageId) return false;
    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(messageId) ? { $or: [{ id: messageId }, { _id: messageId }] } : { id: messageId };
      const result = await Message.deleteOne(query);
      return result.deletedCount > 0;
    } else {
      const messages = readData('messages');
      const filtered = messages.filter(m => m.id !== messageId && m._id !== messageId);
      writeData('messages', filtered);
      return messages.length !== filtered.length;
    }
  },

  getPwaInstallCount: async () => {
    if (isMongoConnected()) {
      const doc = await PwaStats.findOne({ key: 'install_count' }).lean();
      return doc ? doc.count : 0;
    } else {
      const stats = readData('stats');
      const installObj = stats.find(s => s.key === 'install_count');
      return installObj ? installObj.count : 0;
    }
  }
};

module.exports = database;

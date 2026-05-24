const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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
  timestamp: { type: Date, default: Date.now },
  replyTo: { type: mongoose.Schema.Types.Mixed, default: null }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// Helper to determine if we should use MongoDB or JSON files
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const database = {
  getUsers: async () => {
    if (isMongoConnected()) {
      return await User.find({}).lean();
    } else {
      return readData('users');
    }
  },
  
  findUserByEmail: async (email) => {
    if (!email) return null;
    if (isMongoConnected()) {
      return await User.findOne({ email: email.toLowerCase() }).lean();
    } else {
      const users = readData('users');
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  findUserById: async (id) => {
    if (isMongoConnected()) {
      return await User.findOne({ id }).lean();
    } else {
      const users = readData('users');
      return users.find(u => u.id === id) || null;
    }
  },

  createUser: async (userData) => {
    const isAlreadyVerified = userData.verified === true;
    const verificationToken = isAlreadyVerified ? '' : Math.floor(100000 + Math.random() * 900000).toString();
    const cleanEmail = userData.email.toLowerCase();
    
    if (!isAlreadyVerified) {
      // Trigger real email send (runs in background so it doesn't block request)
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
      
      if (!isAlreadyVerified) {
        console.log(`\n======================================================`);
        console.log(`[EMAIL VERIFICATION (MONGODB)]`);
        console.log(`Email: ${cleanEmail}`);
        console.log(`Verification Code: ${verificationToken}`);
        console.log(`======================================================\n`);
      }
      
      return newUser.toObject();
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
      
      if (!isAlreadyVerified) {
        console.log(`\n======================================================`);
        console.log(`[EMAIL VERIFICATION (JSON FILE FALLBACK)]`);
        console.log(`Email: ${cleanEmail}`);
        console.log(`Verification Code: ${verificationToken}`);
        console.log(`======================================================\n`);
      }
      
      return newUser;
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
      return user.toObject();
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
      return users[userIndex];
    }
  },

  getTeams: async () => {
    if (isMongoConnected()) {
      return await Team.find({}).lean();
    } else {
      return readData('teams');
    }
  },
  
  findTeamById: async (id) => {
    if (isMongoConnected()) {
      const team = await Team.findOne({ id }).lean();
      if (team) {
        if (!team.admins || team.admins.length === 0) team.admins = [team.creatorId];
        if (!team.theme) team.theme = 'default';
      }
      return team;
    } else {
      const teams = readData('teams');
      const team = teams.find(t => t.id === id) || null;
      if (team) {
        if (!team.admins || team.admins.length === 0) team.admins = [team.creatorId];
        if (!team.theme) team.theme = 'default';
      }
      return team;
    }
  },

  findTeamsForUser: async (userId) => {
    if (isMongoConnected()) {
      const teams = await Team.find({ members: userId }).lean();
      return teams.map(t => {
        if (!t.admins || t.admins.length === 0) t.admins = [t.creatorId];
        if (!t.theme) t.theme = 'default';
        return t;
      });
    } else {
      const teams = readData('teams');
      return teams.filter(t => t.members.includes(userId)).map(t => {
        if (!t.admins || t.admins.length === 0) t.admins = [t.creatorId];
        if (!t.theme) t.theme = 'default';
        return t;
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
      return newTeam.toObject();
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
      return newTeam;
    }
  },

  joinTeam: async (teamId, passcode, userId) => {
    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId });
      if (!team) throw new Error('Team not found. Please verify the Team ID.');
      if (team.passcode !== passcode) throw new Error('Incorrect passcode. Please try again.');
      if (team.members.includes(userId)) throw new Error('You are already a member of this team.');
      
      team.members.push(userId);
      await team.save();
      return team.toObject();
    } else {
      const teams = readData('teams');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error('Team not found. Please verify the Team ID.');
      
      const team = teams[teamIndex];
      if (team.passcode !== passcode) throw new Error('Incorrect passcode. Please try again.');
      if (team.members.includes(userId)) throw new Error('You are already a member of this team.');
      
      team.members.push(userId);
      teams[teamIndex] = team;
      writeData('teams', teams);
      return team;
    }
  },

  leaveTeam: async (teamId, userId) => {
    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId });
      if (!team) throw new Error('Team not found.');
      if (!team.members.includes(userId)) throw new Error('You are not a member of this team.');
      
      team.members = team.members.filter(m => m !== userId);
      if (team.members.length === 0) {
        await Team.deleteOne({ id: teamId });
        return null;
      } else {
        if (team.creatorId === userId) {
          team.creatorId = team.members[0];
        }
        await team.save();
      }
      return team.toObject();
    } else {
      const teams = readData('teams');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex === -1) throw new Error('Team not found.');
      
      const team = teams[teamIndex];
      if (!team.members.includes(userId)) throw new Error('You are not a member of this team.');
      
      team.members = team.members.filter(m => m !== userId);
      if (team.members.length === 0) {
        teams.splice(teamIndex, 1);
        writeData('teams', teams);
        return null;
      } else {
        if (team.creatorId === userId) {
          team.creatorId = team.members[0];
        }
        teams[teamIndex] = team;
        writeData('teams', teams);
      }
      return team;
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
      return await Message.find({ teamId, channelId }).sort({ timestamp: 1 }).lean();
    } else {
      const messages = readData('messages');
      return messages.filter(m => m.teamId === teamId && m.channelId === channelId);
    }
  },

  createMessage: async (messageData) => {
    if (isMongoConnected()) {
      const newMsg = new Message({
        id: Math.random().toString(36).substr(2, 9),
        ...messageData
      });
      await newMsg.save();
      return newMsg.toObject();
    } else {
      const messages = readData('messages');
      const newMsg = {
        id: Math.random().toString(36).substr(2, 9),
        ...messageData,
        timestamp: new Date().toISOString()
      };
      messages.push(newMsg);
      writeData('messages', messages);
      return newMsg;
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
    if (isMongoConnected()) {
      const user = await User.findOne({ id: userId });
      if (!user) throw new Error('User not found');
      Object.assign(user, updateData, { updatedAt: new Date() });
      await user.save();
      return user.toObject();
    } else {
      const users = readData('users');
      const index = users.findIndex(u => u.id === userId);
      if (index === -1) throw new Error('User not found');
      
      users[index] = {
        ...users[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeData('users', users);
      return users[index];
    }
  },

  getTeamMembers: async (teamId) => {
    if (isMongoConnected()) {
      const team = await Team.findOne({ id: teamId }).lean();
      if (!team) return [];
      const users = await User.find({ id: { $in: team.members } }).lean();
      return users.map(({ password, verificationToken, ...u }) => u);
    } else {
      const teams = readData('teams');
      const team = teams.find(t => t.id === teamId);
      if (!team) return [];
      const users = readData('users');
      return users
        .filter(u => team.members.includes(u.id))
        .map(({ password, verificationToken, ...u }) => u);
    }
  }
};

module.exports = database;

const mongoose = require('mongoose');

// Define Schemas
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
  members: [{ type: String }], // User IDs (string matching User.id)
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
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

const database = {
  getUsers: async () => {
    return await User.find({}).lean();
  },
  
  findUserByEmail: async (email) => {
    if (!email) return null;
    return await User.findOne({ email: email.toLowerCase() }).lean();
  },

  findUserById: async (id) => {
    return await User.findOne({ id }).lean();
  },

  createUser: async (userData) => {
    // Generate a 6-digit email verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = new User({
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      verified: false,
      verificationToken
    });
    
    await newUser.save();
    
    // Log the verification token to the server console for easy retrieval
    console.log(`\n======================================================`);
    console.log(`[EMAIL VERIFICATION]`);
    console.log(`Email: ${userData.email}`);
    console.log(`Verification Code: ${verificationToken}`);
    console.log(`======================================================\n`);
    
    return newUser.toObject();
  },

  verifyUserEmail: async (email, token) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.verificationToken !== token) {
      throw new Error('Invalid verification code.');
    }
    
    user.verified = true;
    user.verificationToken = ''; // Clear token after verification
    await user.save();
    return user.toObject();
  },

  getTeams: async () => {
    return await Team.find({}).lean();
  },
  
  findTeamById: async (id) => {
    return await Team.findOne({ id }).lean();
  },

  findTeamsForUser: async (userId) => {
    return await Team.find({ members: userId }).lean();
  },
  
  createTeam: async (teamData) => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTeam = new Team({
      id: `PULSE-${randomCode}`,
      name: teamData.name,
      passcode: teamData.passcode,
      creatorId: teamData.creatorId,
      members: [teamData.creatorId],
      channels: [
        { id: 'general', name: 'general', description: 'Company-wide announcements and work-based discussions' },
        { id: 'random', name: 'random', description: 'Non-work talk and banter' }
      ]
    });
    await newTeam.save();
    return newTeam.toObject();
  },

  joinTeam: async (teamId, passcode, userId) => {
    const team = await Team.findOne({ id: teamId });
    
    if (!team) {
      throw new Error('Team not found. Please verify the Team ID.');
    }
    
    if (team.passcode !== passcode) {
      throw new Error('Incorrect passcode. Please try again.');
    }
    
    if (team.members.includes(userId)) {
      throw new Error('You are already a member of this team.');
    }
    
    team.members.push(userId);
    await team.save();
    return team.toObject();
  },

  leaveTeam: async (teamId, userId) => {
    const team = await Team.findOne({ id: teamId });
    if (!team) {
      throw new Error('Team not found.');
    }
    if (!team.members.includes(userId)) {
      throw new Error('You are not a member of this team.');
    }
    
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
  },

  updateTeam: async (updatedTeam) => {
    const result = await Team.updateOne({ id: updatedTeam.id }, { $set: updatedTeam });
    return result.modifiedCount > 0;
  },

  getMessages: async (teamId, channelId) => {
    return await Message.find({ teamId, channelId }).sort({ timestamp: 1 }).lean();
  },

  createMessage: async (messageData) => {
    const newMsg = new Message({
      id: Math.random().toString(36).substr(2, 9),
      ...messageData
    });
    await newMsg.save();
    return newMsg.toObject();
  },

  createChannel: async (teamId, channelName, description) => {
    const team = await Team.findOne({ id: teamId });
    if (!team) throw new Error('Team not found');
    
    const channelId = channelName.toLowerCase().replace(/\s+/g, '-').trim();
    
    if (team.channels.some(c => c.id === channelId)) {
      throw new Error('Channel already exists');
    }
    
    const newChannel = {
      id: channelId,
      name: channelName.toLowerCase().trim(),
      description: description || ''
    };
    
    team.channels.push(newChannel);
    await team.save();
    return newChannel;
  },

  updateUser: async (userId, updateData) => {
    const user = await User.findOne({ id: userId });
    if (!user) throw new Error('User not found');
    
    Object.assign(user, updateData, { updatedAt: new Date() });
    await user.save();
    return user.toObject();
  },

  getTeamMembers: async (teamId) => {
    const team = await Team.findOne({ id: teamId }).lean();
    if (!team) return [];
    
    const users = await User.find({ id: { $in: team.members } }).lean();
    return users.map(({ password, verificationToken, ...u }) => u);
  }
};

module.exports = database;

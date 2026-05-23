const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Helper to ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get filepath for a collection
const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

// Helper to read data safely
const readData = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading ${collection}:`, error);
    return [];
  }
};

// Helper to write data safely
const writeData = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${collection}:`, error);
    return false;
  }
};

// User Operations
const database = {
  getUsers: () => readData('users'),
  
  findUserByEmail: (email) => {
    const users = readData('users');
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById: (id) => {
    const users = readData('users');
    return users.find(u => u.id === id);
  },

  createUser: (userData) => {
    const users = readData('users');
    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeData('users', users);
    return newUser;
  },

  // Team Operations
  getTeams: () => readData('teams'),
  
  findTeamById: (id) => {
    const teams = readData('teams');
    return teams.find(t => t.id === id);
  },

  findTeamsForUser: (userId) => {
    const teams = readData('teams');
    return teams.filter(t => t.members.includes(userId));
  },
  
  createTeam: (teamData) => {
    const teams = readData('teams');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTeam = {
      id: `PULSE-${randomCode}`,
      name: teamData.name,
      passcode: teamData.passcode,
      creatorId: teamData.creatorId,
      members: [teamData.creatorId],
      channels: [
        { id: 'general', name: 'general', description: 'Company-wide announcements and work-based discussions' },
        { id: 'random', name: 'random', description: 'Non-work talk and banter' }
      ],
      createdAt: new Date().toISOString()
    };
    teams.push(newTeam);
    writeData('teams', teams);
    return newTeam;
  },

  joinTeam: (teamId, passcode, userId) => {
    const teams = readData('teams');
    const teamIndex = teams.findIndex(t => t.id === teamId);
    
    if (teamIndex === -1) {
      throw new Error('Team not found. Please verify the Team ID.');
    }
    
    const team = teams[teamIndex];
    if (team.passcode !== passcode) {
      throw new Error('Incorrect passcode. Please try again.');
    }
    
    if (team.members.includes(userId)) {
      throw new Error('You are already a member of this team.');
    }
    
    team.members.push(userId);
    teams[teamIndex] = team;
    writeData('teams', teams);
    return team;
  },

  leaveTeam: (teamId, userId) => {
    const teams = readData('teams');
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) {
      throw new Error('Team not found.');
    }
    const team = teams[teamIndex];
    if (!team.members.includes(userId)) {
      throw new Error('You are not a member of this team.');
    }
    team.members = team.members.filter(m => m !== userId);
    if (team.members.length === 0) {
      // Delete team if no members are left
      teams.splice(teamIndex, 1);
    } else {
      if (team.creatorId === userId) {
        team.creatorId = team.members[0];
      }
      teams[teamIndex] = team;
    }
    writeData('teams', teams);
    return team;
  },

  updateTeam: (updatedTeam) => {
    const teams = readData('teams');
    const index = teams.findIndex(t => t.id === updatedTeam.id);
    if (index !== -1) {
      teams[index] = updatedTeam;
      writeData('teams', teams);
      return true;
    }
    return false;
  },

  // Message Operations
  getMessages: (teamId, channelId) => {
    const messages = readData('messages');
    return messages.filter(m => m.teamId === teamId && m.channelId === channelId);
  },

  createMessage: (messageData) => {
    const messages = readData('messages');
    const newMsg = {
      id: Math.random().toString(36).substr(2, 9),
      ...messageData,
      timestamp: new Date().toISOString()
    };
    messages.push(newMsg);
    writeData('messages', messages);
    return newMsg;
  },

  createChannel: (teamId, channelName, description) => {
    const teams = readData('teams');
    const index = teams.findIndex(t => t.id === teamId);
    if (index === -1) throw new Error('Team not found');
    
    const newChannel = {
      id: channelName.toLowerCase().replace(/\s+/g, '-').trim(),
      name: channelName.toLowerCase().trim(),
      description: description || ''
    };
    
    // Check if channel already exists
    if (teams[index].channels.some(c => c.id === newChannel.id)) {
      throw new Error('Channel already exists');
    }
    
    teams[index].channels.push(newChannel);
    writeData('teams', teams);
    return newChannel;
  },

  updateUser: (userId, updateData) => {
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
  },

  getTeamMembers: (teamId) => {
    const teams = readData('teams');
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    
    const users = readData('users');
    return users
      .filter(u => team.members.includes(u.id))
      .map(({ password, ...u }) => u);
  }
};

module.exports = database;

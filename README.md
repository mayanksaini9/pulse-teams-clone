# Pulse - Real-Time Team Collaboration Platform 🚀

Pulse is a premium, feature-rich real-time team collaboration platform (Microsoft Teams clone) designed with a modern glassmorphic interface. It supports instant group messaging, threaded replies, voice notes, camera captures, and WebRTC-based multi-user video and voice calls.

👉 **Live Demo:** [https://pulse-teams.onrender.com](https://pulse-teams.onrender.com)

---

## ✨ Features

### 📞 WebRTC Video & Voice Meetings
- **Cross-Network Traversal**: Configured with public STUN/TURN servers to allow stable calls across different networks (e.g., home Wi-Fi to 4G/5G mobile data).
- **Picture-in-Picture (PiP)**: Draggable, floating call panel that allows users to multitask and browse chat channels while remaining in a call.
- **Microphone & Camera Controls**: Toggle audio/video instantly with active participant grids.
- **Screen Sharing**: Support for sharing screens with high-definition rendering.

### 💬 Real-Time Rich Messaging
- **Socket.io Channels**: Instant message dispatching and status propagation.
- **Threaded Replies**: Swipe-to-reply gesture controls for mobile, and hover menu controls for desktop.
- **Voice Messages**: Record and send voice notes inline with a custom audio player.
- **Camera Snapshots**: Capture webcam photos and share them immediately as stickers in chat.
- **File Attachments**: Upload and download any files (PDF, ZIP, DOCX, images) directly within channel feeds.

### 🔐 Accounts & Persistence
- **Secure Authentication**: User sign-ups and logins secured by JWT (JSON Web Tokens) and bcrypt password hashing.
- **Email Verification**: One-time registration pins delivered through a secure SMTP mail client.
- **Cloud Database (MongoDB Atlas)**: Permanent storage for channels, user profiles, teams, and chat histories.

---

## 🛠️ Tech Stack

- **Frontend**: React (Hooks, Context API), Vite, Lucide Icons, Vanilla CSS (Glassmorphism design system)
- **Backend**: Node.js, Express, Socket.io
- **Database**: MongoDB & Mongoose (with automated fallback to local storage files if cloud connectivity is absent)
- **Email Service**: Brevo SMTP (NodeMailer)
- **Hosting**: Render (Web Services)

---

## ⚙️ Environment Configuration

To run the application locally or deploy it to production, set up the following environment variables in a `.env` file inside the `server/` directory:

```env
# Server Configuration
PORT=10000
JWT_SECRET=your_jwt_secret_here

# MongoDB URI (MongoDB Atlas or Local Connection)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.ojl3qgz.mongodb.net/pulse-teams?retryWrites=true&w=majority

# Email Verification SMTP Configuration
SMTP_HOST=smtp-brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

---

## 🚀 Local Installation & Setup

Follow these steps to run Pulse on your local development machine:

### Prerequisite
Ensure you have **Node.js** (v18+) and **MongoDB** (or MongoDB Atlas account) installed.

### 1. Clone the Repository
```bash
git clone https://github.com/mayanksaini9/pulse-teams-clone.git
cd pulse-teams-clone
```

### 2. Install Server Dependencies
```bash
cd server
npm install
```
Configure your `.env` file as described in the Environment Configuration section.

### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

### 4. Run the Application
You can run both client and server concurrently:

**Start Server:**
```bash
cd ../server
npm run dev
```

**Start Client:**
```bash
cd ../client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 📂 Project Directory Structure

```text
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Shared UI Components (Draggable panels, etc.)
│   │   ├── context/            # Global React Contexts (TeamContext, CallContext)
│   │   ├── pages/              # App Pages (Teams Dashboard, CallOverlay, Login)
│   │   └── index.css           # Global glassmorphism design tokens
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express & Socket.io Backend
│   ├── server.js               # Application entry & socket routers
│   ├── database.js             # Database schemas & MongoDB connections
│   ├── email.js                # SMTP email verification helpers
│   ├── package.json
│   └── .env
```

---

## 🛡️ License

This project is licensed under the MIT License.

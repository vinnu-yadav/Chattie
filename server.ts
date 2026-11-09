import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory server-authoritative store synced with persistence
interface ServerUser {
  id: string;
  chatId: string;
  googleEmail: string;
  googleName: string;
  name: string;
  handle: string;
  password?: string;
  avatar: string;
  bio?: string;
  createdAt: number;
  isOnline: boolean;
  lastSeen?: number;
}

interface ServerMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

interface ServerConversation {
  id: string;
  participants: [string, string];
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
  unreadCount: Record<string, number>;
  updatedAt: number;
}

interface ServerFriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

interface ServerCallSignal {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  callType: 'voice' | 'video';
  status: 'outgoing' | 'incoming' | 'connected' | 'ended' | 'declined';
  offer?: any;
  answer?: any;
  candidates?: any[];
  updatedAt: number;
}

// Server-side State
let users: ServerUser[] = [];
let messages: ServerMessage[] = [];
let conversations: ServerConversation[] = [];
let friendRequests: ServerFriendRequest[] = [];
let activeCalls: Record<string, ServerCallSignal> = {};

// Helper: generate 5-digit numeric Chat ID
function generateServerChatId(): string {
  const existing = new Set(users.map((u) => u.chatId));
  let attempts = 0;
  while (attempts < 50000) {
    const candidate = String(Math.floor(10000 + Math.random() * 90000));
    if (!existing.has(candidate)) return candidate;
    attempts++;
  }
  return String(10000 + (users.length + 1) * 37).slice(-5);
}

// --- SERVER-SIDE API ROUTES ---

// Health & System status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: Date.now(), usersCount: users.length });
});

// Users: Search users (CRITICAL RULE: Show only name, handle, avatar, bio - NEVER 5-digit Chat ID!)
app.get('/api/users/search', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const excludeId = String(req.query.excludeId || '');

  const filtered = users
    .filter((u) => {
      if (excludeId && u.id === excludeId) return false;
      if (!query) return true;
      return u.name.toLowerCase().includes(query) || u.handle.toLowerCase().includes(query);
    })
    .map((u) => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isOnline: u.isOnline,
    }));

  res.json({ users: filtered });
});

// Check if Google email already exists
app.post('/api/auth/check-google-email', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const clean = String(email).trim().toLowerCase();
  const existing = users.find((u) => u.googleEmail.trim().toLowerCase() === clean);

  res.json({
    exists: !!existing,
    name: existing?.name,
  });
});

// Register user via Google account login
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { googleEmail, googleName, name, handle, password, avatar, bio } = req.body;

  if (!googleEmail || !password || !name) {
    return res.status(400).json({ error: 'Missing required registration parameters' });
  }

  const cleanEmail = String(googleEmail).trim().toLowerCase();
  const exists = users.some((u) => u.googleEmail.trim().toLowerCase() === cleanEmail);
  if (exists) {
    return res.status(409).json({
      error: 'An account is already linked to this Google email. Please log in using your 5-digit Chat ID and password.',
    });
  }

  const chatId = generateServerChatId();
  let cleanHandle = String(handle || '@user').trim();
  if (!cleanHandle.startsWith('@')) cleanHandle = '@' + cleanHandle;

  const newUser: ServerUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    chatId,
    googleEmail: cleanEmail,
    googleName: googleName || name,
    name: String(name).trim(),
    handle: cleanHandle,
    password: String(password),
    avatar:
      avatar ||
      `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
    bio: bio || 'New member of Chattie ✨',
    createdAt: Date.now(),
    isOnline: false,
  };

  users.push(newUser);
  res.status(201).json({ user: newUser });
});

// Login strictly via 5-digit Chat ID and Password
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { chatId, password } = req.body;
  const cleanId = String(chatId || '').trim();

  if (!/^\d{5}$/.test(cleanId)) {
    return res.status(400).json({ error: 'Chat ID must be exactly a 5-digit number.' });
  }

  const user = users.find((u) => u.chatId === cleanId);
  if (!user) {
    return res.status(404).json({ error: 'No account found with this 5-digit Chat ID.' });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please verify your credentials or reset password.' });
  }

  user.isOnline = true;
  user.lastSeen = Date.now();

  res.json({ user });
});

// Forgot Password: Find account by Chat ID and return masked email
app.get('/api/auth/forgot-password/:chatId', (req: Request, res: Response) => {
  const cleanId = String(req.params.chatId || '').trim();
  if (!/^\d{5}$/.test(cleanId)) {
    return res.status(400).json({ error: 'Please enter a valid 5-digit numeric Chat ID.' });
  }

  const user = users.find((u) => u.chatId === cleanId);
  if (!user) {
    return res.status(404).json({ error: `No Chattie account exists with Chat ID #${cleanId}.` });
  }

  const [localPart, domain] = user.googleEmail.split('@');
  let masked = localPart;
  if (localPart.length > 2) {
    masked = localPart[0] + '*'.repeat(Math.max(3, localPart.length - 2)) + localPart[localPart.length - 1];
  } else {
    masked = localPart[0] + '***';
  }

  res.json({
    name: user.name,
    maskedEmail: `${masked}@${domain || 'gmail.com'}`,
    fullEmail: user.googleEmail,
  });
});

// Reset Password
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { chatId, newPassword } = req.body;
  const cleanId = String(chatId || '').trim();

  const user = users.find((u) => u.chatId === cleanId);
  if (!user) return res.status(404).json({ error: 'Account not found' });

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  user.password = String(newPassword);
  res.json({ ok: true, message: 'Password updated successfully' });
});

// Update Profile / DP
app.patch('/api/users/:userId/profile', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, handle, avatar, bio } = req.body;
  if (name) user.name = String(name).trim();
  if (handle) {
    let h = String(handle).trim();
    if (!h.startsWith('@')) h = '@' + h;
    user.handle = h;
  }
  if (avatar) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;

  res.json({ user });
});

// Friend requests & Accepted friends
app.get('/api/friends/accepted/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const acceptedFriendIds = new Set<string>();

  friendRequests.forEach((r) => {
    if (r.status === 'accepted') {
      if (r.senderId === userId) acceptedFriendIds.add(r.receiverId);
      if (r.receiverId === userId) acceptedFriendIds.add(r.senderId);
    }
  });

  const friends = users
    .filter((u) => acceptedFriendIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isOnline: u.isOnline,
    }));

  res.json({ friends });
});

app.post('/api/friends/request', (req: Request, res: Response) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'Missing parameters' });

  const existing = friendRequests.find(
    (r) =>
      (r.senderId === senderId && r.receiverId === receiverId) ||
      (r.senderId === receiverId && r.receiverId === senderId)
  );

  if (existing) {
    if (existing.status === 'declined') {
      existing.status = 'pending';
      existing.senderId = senderId;
      existing.receiverId = receiverId;
      existing.createdAt = Date.now();
    }
    return res.json({ request: existing });
  }

  const newReq: ServerFriendRequest = {
    id: 'freq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    senderId,
    receiverId,
    status: 'pending',
    createdAt: Date.now(),
  };

  friendRequests.push(newReq);
  res.status(201).json({ request: newReq });
});

app.post('/api/friends/request/:id/accept', (req: Request, res: Response) => {
  const target = friendRequests.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Request not found' });
  target.status = 'accepted';
  res.json({ ok: true, request: target });
});

app.post('/api/friends/request/:id/decline', (req: Request, res: Response) => {
  const target = friendRequests.find((r) => r.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Request not found' });
  target.status = 'declined';
  res.json({ ok: true, request: target });
});

// Conversations & Messages
app.get('/api/conversations/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userConvs = conversations.filter((c) => c.participants.includes(userId));
  res.json({ conversations: userConvs });
});

app.get('/api/messages/:conversationId', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const convMsgs = messages.filter((m) => m.conversationId === conversationId);
  res.json({ messages: convMsgs });
});

app.post('/api/messages/send', (req: Request, res: Response) => {
  const { conversationId, senderId, receiverId, text, imageUrl } = req.body;
  if (!conversationId || !senderId || !receiverId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const newMsg: ServerMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    conversationId,
    senderId,
    receiverId,
    text: String(text || '').trim(),
    imageUrl,
    timestamp: Date.now(),
    status: 'sent',
  };

  messages.push(newMsg);

  let conv = conversations.find((c) => c.id === conversationId);
  if (!conv) {
    conv = {
      id: conversationId,
      participants: [senderId, receiverId],
      unreadCount: { [senderId]: 0, [receiverId]: 1 },
      updatedAt: Date.now(),
      lastMessage: {
        text: newMsg.text || '📷 Photo',
        timestamp: newMsg.timestamp,
        senderId: newMsg.senderId,
      },
    };
    conversations.unshift(conv);
  } else {
    conv.lastMessage = {
      text: newMsg.text || '📷 Photo',
      timestamp: newMsg.timestamp,
      senderId: newMsg.senderId,
    };
    conv.unreadCount[receiverId] = (conv.unreadCount[receiverId] || 0) + 1;
    conv.updatedAt = Date.now();
  }

  res.status(201).json({ message: newMsg, conversation: conv });
});

// WebRTC Signaling API over Server
app.post('/api/calls/signal', (req: Request, res: Response) => {
  const { callId, type, payload } = req.body;
  if (!callId) return res.status(400).json({ error: 'callId required' });

  if (type === 'call_initiated') {
    activeCalls[callId] = {
      ...payload,
      updatedAt: Date.now(),
    };
  } else if (activeCalls[callId]) {
    const call = activeCalls[callId];
    if (type === 'webrtc_offer') call.offer = payload.offer;
    if (type === 'webrtc_answer') call.answer = payload.answer;
    if (type === 'call_accepted') call.status = 'connected';
    if (type === 'call_declined') call.status = 'declined';
    if (type === 'call_ended') delete activeCalls[callId];
    if (type === 'webrtc_ice') {
      if (!call.candidates) call.candidates = [];
      call.candidates.push(payload.candidate);
    }
  }

  res.json({ ok: true, call: activeCalls[callId] || null });
});

app.get('/api/calls/:callId', (req: Request, res: Response) => {
  const call = activeCalls[req.params.callId];
  res.json({ call: call || null });
});

// Vite middleware for development server integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const httpServer = createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`Chattie Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

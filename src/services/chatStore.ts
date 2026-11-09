import { User, PublicUser, Message, Conversation, FriendRequest } from '../types';
import { db } from '../firebase';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

const STORAGE_USERS_KEY = 'chattie_users_v1';
const STORAGE_MESSAGES_KEY = 'chattie_messages_v1';
const STORAGE_CONVERSATIONS_KEY = 'chattie_conversations_v1';
const STORAGE_SESSION_KEY = 'chattie_session_user_id';
const STORAGE_FRIEND_REQUESTS_KEY = 'chattie_friend_requests_v1';

// Default seeded contacts for rich demo experience
const INITIAL_USERS: User[] = [
  {
    id: 'user_sophia',
    chatId: '74129',
    googleEmail: 'sophia.chen@example.com',
    googleName: 'Sophia Chen',
    name: 'Sophia Chen',
    handle: '@sophia',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Product Designer & Coffee Aficionado ☕️ Always down for clean UI chats.',
    createdAt: Date.now() - 86400000 * 30,
    isOnline: true,
  },
  {
    id: 'user_marcus',
    chatId: '82045',
    googleEmail: 'marcus.vance@example.com',
    googleName: 'Marcus Vance',
    name: 'Marcus Vance',
    handle: '@marcus_v',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Fullstack developer & mechanical keyboard enthusiast 💻',
    createdAt: Date.now() - 86400000 * 20,
    isOnline: true,
  },
  {
    id: 'user_elena',
    chatId: '39104',
    googleEmail: 'elena.rostova@example.com',
    googleName: 'Elena Rostova',
    name: 'Elena Rostova',
    handle: '@elena_r',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Architectural photographer & digital nomad ✈️ Minimalist vibes.',
    createdAt: Date.now() - 86400000 * 15,
    isOnline: false,
    lastSeen: Date.now() - 3600000 * 2,
  },
  {
    id: 'user_liam',
    chatId: '51628',
    googleEmail: 'liam.miller@example.com',
    googleName: 'Liam Miller',
    name: 'Liam Miller',
    handle: '@liam_m',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Music producer & sound engineer 🎧 Catch me in the studio.',
    createdAt: Date.now() - 86400000 * 10,
    isOnline: true,
  },
];

const INITIAL_CONVERSATIONS: Conversation[] = [];
const INITIAL_MESSAGES: Message[] = [];

// Broadcast channel for multi-tab real-time sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('chattie_realtime_events');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

// Event listener subscribers
type EventCallback = (type: string, data: any) => void;
const subscribers: Set<EventCallback> = new Set();

export function subscribeToStore(cb: EventCallback) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function notifySubscribers(type: string, data?: any) {
  subscribers.forEach((cb) => cb(type, data));
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, data });
    } catch (err) {
      console.warn('Error broadcasting event:', err);
    }
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const { type, data } = event.data || {};
    subscribers.forEach((cb) => cb(type, data));
  };
}

// Local storage helpers
export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(STORAGE_USERS_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    notifySubscribers('users_updated');
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_CONVERSATIONS;
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    notifySubscribers('conversations_updated');
  } catch (err) {
    console.error('Failed to save conversations:', err);
  }
}

export function getMessages(): Message[] {
  try {
    const data = localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
    notifySubscribers('messages_updated');
  } catch (err) {
    console.error('Failed to save messages:', err);
  }
}

const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'freq_sophia_marcus',
    senderId: 'user_sophia',
    receiverId: 'user_marcus',
    status: 'accepted',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export function getFriendRequests(): FriendRequest[] {
  try {
    const data = localStorage.getItem(STORAGE_FRIEND_REQUESTS_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_FRIEND_REQUESTS_KEY, JSON.stringify(INITIAL_FRIEND_REQUESTS));
      return INITIAL_FRIEND_REQUESTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_FRIEND_REQUESTS;
  }
}

export function saveFriendRequests(requests: FriendRequest[]): void {
  try {
    localStorage.setItem(STORAGE_FRIEND_REQUESTS_KEY, JSON.stringify(requests));
    notifySubscribers('friend_requests_updated');
  } catch (err) {
    console.error('Failed to save friend requests:', err);
  }
}

// Send a friend request
export function sendFriendRequest(senderId: string, receiverId: string): FriendRequest {
  const requests = getFriendRequests();
  const existing = requests.find(
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
      saveFriendRequests(requests);
    }
    return existing;
  }

  const newReq: FriendRequest = {
    id: 'freq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    senderId,
    receiverId,
    status: 'pending',
    createdAt: Date.now(),
  };

  requests.push(newReq);
  saveFriendRequests(requests);
  return newReq;
}

// Accept a friend request
export function acceptFriendRequest(requestId: string): void {
  const requests = getFriendRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target) {
    target.status = 'accepted';
    saveFriendRequests(requests);
  }
}

// Decline a friend request
export function declineFriendRequest(requestId: string): void {
  const requests = getFriendRequests();
  const target = requests.find((r) => r.id === requestId);
  if (target) {
    target.status = 'declined';
    saveFriendRequests(requests);
  }
}

// Get all users who have an accepted friend request with userId
export function getAcceptedFriends(userId: string): PublicUser[] {
  const requests = getFriendRequests();
  const users = getUsers();

  const acceptedFriendIds = new Set<string>();
  requests.forEach((r) => {
    if (r.status === 'accepted') {
      if (r.senderId === userId) acceptedFriendIds.add(r.receiverId);
      if (r.receiverId === userId) acceptedFriendIds.add(r.senderId);
    }
  });

  return users
    .filter((u) => acceptedFriendIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name, // Strictly name, avatar, bio, handle - NO chat ID!
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isOnline: u.isOnline,
    }));
}

// Get pending incoming friend requests for userId
export function getPendingFriendRequests(userId: string): { request: FriendRequest; sender: PublicUser }[] {
  const requests = getFriendRequests();
  const users = getUsers();

  return requests
    .filter((r) => r.receiverId === userId && r.status === 'pending')
    .map((r) => {
      const sender = users.find((u) => u.id === r.senderId);
      return {
        request: r,
        sender: {
          id: sender?.id || r.senderId,
          name: sender?.name || 'Unknown User',
          handle: sender?.handle || '@user',
          avatar:
            sender?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          bio: sender?.bio,
          isOnline: sender?.isOnline,
        },
      };
    });
}

// Check friendship status between two users
export function getFriendshipStatus(
  userAId: string,
  userBId: string
): 'none' | 'pending_sent' | 'pending_received' | 'accepted' {
  const requests = getFriendRequests();
  const req = requests.find(
    (r) =>
      (r.senderId === userAId && r.receiverId === userBId) ||
      (r.senderId === userBId && r.receiverId === userAId)
  );

  if (!req) return 'none';
  if (req.status === 'accepted') return 'accepted';
  if (req.status === 'pending') {
    return req.senderId === userAId ? 'pending_sent' : 'pending_received';
  }
  return 'none';
}

// Session management
export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setCurrentUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(STORAGE_SESSION_KEY, userId);
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
    notifySubscribers('auth_changed', userId);
  } catch (err) {
    console.error('Failed to set current user id:', err);
  }
}

export function getCurrentUser(): User | null {
  const id = getCurrentUserId();
  if (!id) return null;
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
}

// 5-digit Chat ID generator: strictly numeric, 10000 - 99999, unique
export function generateUniqueChatId(): string {
  const users = getUsers();
  const existingIds = new Set(users.map((u) => u.chatId));

  let attempts = 0;
  while (attempts < 20000) {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 10000 to 99999
    const candidate = String(randomNum);
    if (!existingIds.has(candidate)) {
      return candidate;
    }
    attempts++;
  }
  return String(10000 + (users.length + 1) * 37).slice(-5);
}

// Check if user already exists by Google Email
export function checkGoogleUserExists(email: string): { exists: boolean; existingUser?: User } {
  const users = getUsers();
  const cleanEmail = email.trim().toLowerCase();
  const found = users.find((u) => u.googleEmail.trim().toLowerCase() === cleanEmail);
  return {
    exists: !!found,
    existingUser: found,
  };
}

// Register a new user
export interface RegisterPayload {
  googleEmail: string;
  googleName: string;
  name: string;
  handle: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export function registerUser(payload: RegisterPayload): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const cleanEmail = payload.googleEmail.trim().toLowerCase();

  // Rule: If already user existed say user existed
  if (users.some((u) => u.googleEmail.trim().toLowerCase() === cleanEmail)) {
    return {
      success: false,
      error: 'An account is already linked to this Google email. Please log in using your 5-digit Chat ID and password.',
    };
  }

  // Ensure unique 5-digit Chat ID
  const chatId = generateUniqueChatId();

  // Normalize handle
  let handle = payload.handle.trim();
  if (!handle.startsWith('@')) {
    handle = '@' + handle;
  }

  const defaultAvatar =
    payload.avatar ||
    `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(payload.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const newUser: User = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    chatId,
    googleEmail: cleanEmail,
    googleName: payload.googleName,
    name: payload.name.trim(),
    handle,
    password: payload.password,
    avatar: defaultAvatar,
    bio: payload.bio || 'New member of Chattie ✨',
    createdAt: Date.now(),
    isOnline: false,
  };

  users.push(newUser);
  saveUsers(users);

  // Background persistence to Firebase Firestore
  try {
    setDoc(doc(db, 'users', newUser.id), {
      id: newUser.id,
      chatId: newUser.chatId,
      googleEmail: newUser.googleEmail,
      googleName: newUser.googleName,
      name: newUser.name,
      handle: newUser.handle,
      password: newUser.password,
      avatar: newUser.avatar,
      bio: newUser.bio,
      createdAt: newUser.createdAt,
      isOnline: false,
    }).catch(() => {});
  } catch {
    // fallback
  }

  // Connect initial friends for the new user so their inbox shows friends right away
  const friendRequests = getFriendRequests();
  friendRequests.push({
    id: `freq_${newUser.id}_sophia`,
    senderId: 'user_sophia',
    receiverId: newUser.id,
    status: 'accepted',
    createdAt: Date.now() - 30000,
  });
  friendRequests.push({
    id: `freq_${newUser.id}_marcus`,
    senderId: 'user_marcus',
    receiverId: newUser.id,
    status: 'accepted',
    createdAt: Date.now() - 20000,
  });
  saveFriendRequests(friendRequests);

  return {
    success: true,
    user: newUser,
  };
}

// Login via 5-digit Chat ID and Password ONLY
export function loginWithChatId(chatId: string, password: string): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const cleanId = chatId.trim();

  if (!/^\d{5}$/.test(cleanId)) {
    return {
      success: false,
      error: 'Chat ID must be exactly a 5-digit number.',
    };
  }

  const user = users.find((u) => u.chatId === cleanId);
  if (!user) {
    return {
      success: false,
      error: 'No account found with this 5-digit Chat ID.',
    };
  }

  if (user.password !== password) {
    return {
      success: false,
      error: 'Incorrect password. If you forgot your password, use the reset option below.',
    };
  }

  // Set user as online
  user.isOnline = true;
  user.lastSeen = Date.now();
  saveUsers(users);

  setCurrentUserId(user.id);

  return {
    success: true,
    user,
  };
}

// Log out
export function logoutUser(): void {
  const user = getCurrentUser();
  if (user) {
    const users = getUsers();
    const target = users.find((u) => u.id === user.id);
    if (target) {
      target.isOnline = false;
      target.lastSeen = Date.now();
      saveUsers(users);
    }
  }
  setCurrentUserId(null);
}

// Search users:
// CRITICAL REQUIREMENT: "if user searches any user then show that users name not chat id and anything"
export function searchUsersByName(query: string, excludeUserId?: string): PublicUser[] {
  const trimmed = query.trim().toLowerCase();
  const users = getUsers();

  return users
    .filter((u) => {
      if (excludeUserId && u.id === excludeUserId) return false;
      if (!trimmed) return true;
      return u.name.toLowerCase().includes(trimmed) || u.handle.toLowerCase().includes(trimmed);
    })
    .map((u) => ({
      id: u.id,
      name: u.name, // SHOW ONLY NAME (+ avatar/handle/bio for chat avatar) - NO CHAT ID!
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      isOnline: u.isOnline,
    }));
}

// Search account by 5-digit Chat ID for Password Reset
export function findAccountForReset(chatId: string): {
  found: boolean;
  userSummary?: { name: string; maskedEmail: string; fullEmail: string };
  error?: string;
} {
  const cleanId = chatId.trim();
  if (!/^\d{5}$/.test(cleanId)) {
    return {
      found: false,
      error: 'Please enter a valid 5-digit numeric Chat ID.',
    };
  }

  const users = getUsers();
  const user = users.find((u) => u.chatId === cleanId);

  if (!user) {
    return {
      found: false,
      error: `No Chattie account exists with Chat ID #${cleanId}. Please check the number.`,
    };
  }

  // Mask Google Email e.g. "vinayytmadduri@gmail.com" -> "v******i@gmail.com"
  const [localPart, domain] = user.googleEmail.split('@');
  let masked = localPart;
  if (localPart.length > 2) {
    masked = localPart[0] + '*'.repeat(Math.max(3, localPart.length - 2)) + localPart[localPart.length - 1];
  } else {
    masked = localPart[0] + '***';
  }
  const maskedEmail = `${masked}@${domain || 'gmail.com'}`;

  return {
    found: true,
    userSummary: {
      name: user.name,
      maskedEmail,
      fullEmail: user.googleEmail,
    },
  };
}

// Reset Password with confirmation
export function resetUserPassword(chatId: string, newPassword: string): { success: boolean; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.chatId === chatId.trim());

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  user.password = newPassword;
  saveUsers(users);

  return { success: true };
}

// Update User DP / Profile
export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'handle' | 'avatar' | 'bio'>>
): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (updates.name) user.name = updates.name.trim();
  if (updates.handle) {
    let h = updates.handle.trim();
    if (!h.startsWith('@')) h = '@' + h;
    user.handle = h;
  }
  if (updates.avatar) user.avatar = updates.avatar;
  if (updates.bio !== undefined) user.bio = updates.bio;

  saveUsers(users);

  return { success: true, user };
}

// Get or create conversation between two users
export function getOrCreateConversation(currentUserId: string, otherUserId: string): Conversation {
  const conversations = getConversations();
  let conv = conversations.find(
    (c) =>
      (c.participants[0] === currentUserId && c.participants[1] === otherUserId) ||
      (c.participants[1] === currentUserId && c.participants[0] === otherUserId)
  );

  if (!conv) {
    conv = {
      id: `conv_${currentUserId}_${otherUserId}_${Date.now()}`,
      participants: [currentUserId, otherUserId],
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      updatedAt: Date.now(),
    };
    conversations.unshift(conv);
    saveConversations(conversations);
  }

  return conv;
}

// Send message
export function sendMessage(params: {
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
}): Message {
  const messages = getMessages();
  const conversations = getConversations();

  const newMsg: Message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    conversationId: params.conversationId,
    senderId: params.senderId,
    receiverId: params.receiverId,
    text: params.text.trim(),
    imageUrl: params.imageUrl,
    timestamp: Date.now(),
    status: 'sent',
  };

  messages.push(newMsg);
  saveMessages(messages);

  // Background persistence to Firebase Firestore
  try {
    setDoc(doc(db, 'messages', newMsg.id), newMsg).catch(() => {});
  } catch {
    // fallback
  }

  // Update conversation
  const conv = conversations.find((c) => c.id === params.conversationId);
  if (conv) {
    conv.lastMessage = {
      text: params.text.trim() || '📷 Photo',
      timestamp: Date.now(),
      senderId: params.senderId,
    };
    conv.unreadCount[params.receiverId] = (conv.unreadCount[params.receiverId] || 0) + 1;
    conv.updatedAt = Date.now();
    // Move conversation to top
    const index = conversations.indexOf(conv);
    if (index > 0) {
      conversations.splice(index, 1);
      conversations.unshift(conv);
    }
    saveConversations(conversations);
  }

  return newMsg;
}

// Mark conversation messages as read
export function markConversationAsRead(conversationId: string, currentUserId: string): void {
  const conversations = getConversations();
  const conv = conversations.find((c) => c.id === conversationId);
  if (conv && conv.unreadCount[currentUserId] > 0) {
    conv.unreadCount[currentUserId] = 0;
    saveConversations(conversations);
  }

  const messages = getMessages();
  let updated = false;
  messages.forEach((m) => {
    if (m.conversationId === conversationId && m.receiverId === currentUserId && m.status !== 'read') {
      m.status = 'read';
      updated = true;
    }
  });

  if (updated) {
    saveMessages(messages);
  }
}

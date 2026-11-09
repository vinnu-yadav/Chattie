export interface User {
  id: string; // Internal unique ID
  chatId: string; // 5-digit unique numeric Chat ID (e.g. "48291")
  googleEmail: string; // Linked Google account email
  googleName: string; // Name from Google
  name: string; // Display Name / Full Name
  handle: string; // Unique handle e.g. @vinay
  password: string; // User password
  avatar: string; // DP (Display Picture) URL or data URL
  bio?: string;
  createdAt: number;
  lastSeen?: number;
  isOnline?: boolean;
}

// Strictly public user information for searches (NO chatId, NO password, NO email)
export interface PublicUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio?: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: [string, string]; // user IDs
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
  unreadCount: Record<string, number>; // keyed by userId
  updatedAt: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}


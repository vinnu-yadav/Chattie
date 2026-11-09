import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Image as ImageIcon,
  Lock,
  Search,
  CheckCheck,
  Check,
  User as UserIcon,
  Phone,
  Video,
  ArrowLeft,
  Sparkles,
  KeyRound,
  Users,
  UserCheck,
  UserPlus,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { User, Message, Conversation, PublicUser, FriendRequest } from '../types';
import {
  getConversations,
  getMessages,
  getUsers,
  sendMessage,
  markConversationAsRead,
  getOrCreateConversation,
  getAcceptedFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../services/chatStore';

interface InboxViewProps {
  currentUser: User | null;
  activeTargetUserId?: string | null;
  onRequestLogin: () => void;
  onRequestRegister: () => void;
  onNavigateToSearch: () => void;
  onStartVoiceCall: (user: User | PublicUser) => void;
  onStartVideoCall: (user: User | PublicUser) => void;
}

const QUICK_EMOJIS = ['❤️', '😂', '🔥', '👍', '🎉', '✨', '👋', '🙌', '💯', '🚀'];

export const InboxView: React.FC<InboxViewProps> = ({
  currentUser,
  activeTargetUserId,
  onRequestLogin,
  onRequestRegister,
  onNavigateToSearch,
  onStartVoiceCall,
  onStartVideoCall,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<PublicUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ request: FriendRequest; sender: PublicUser }[]>([]);

  // Navigation tab inside Inbox: 'friends' | 'all_chats'
  const [sidebarTab, setSidebarTab] = useState<'friends' | 'all_chats'>('friends');

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load state and listen for updates
  const refreshData = () => {
    setConversations(getConversations());
    setMessages(getMessages());
    setUsers(getUsers());
    if (currentUser) {
      setAcceptedFriends(getAcceptedFriends(currentUser.id));
      setPendingRequests(getPendingFriendRequests(currentUser.id));
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle activeTargetUserId if provided via "Message" action from SearchAccount
  useEffect(() => {
    if (currentUser && activeTargetUserId) {
      const conv = getOrCreateConversation(currentUser.id, activeTargetUserId);
      setActiveConvId(conv.id);
      refreshData();
    }
  }, [currentUser, activeTargetUserId]);

  // Set default active conversation if none selected
  useEffect(() => {
    if (currentUser && !activeConvId && conversations.length > 0) {
      const userConvs = conversations.filter((c) => c.participants.includes(currentUser.id));
      if (userConvs.length > 0) {
        setActiveConvId(userConvs[0].id);
      }
    }
  }, [currentUser, conversations, activeConvId]);

  // Mark active conversation as read
  useEffect(() => {
    if (currentUser && activeConvId) {
      markConversationAsRead(activeConvId, currentUser.id);
    }
  }, [currentUser, activeConvId, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConvId]);

  // INITIATE CHAT with a selected user
  const handleInitiateChat = (targetUserId: string) => {
    if (!currentUser) return;
    const conv = getOrCreateConversation(currentUser.id, targetUserId);
    setActiveConvId(conv.id);
    refreshData();
  };

  // Accept incoming friend request
  const handleAcceptRequest = (requestId: string, senderId: string) => {
    acceptFriendRequest(requestId);
    refreshData();
    // Automatically initiate chat with the newly accepted friend
    handleInitiateChat(senderId);
  };

  const handleDeclineRequest = (requestId: string) => {
    declineFriendRequest(requestId);
    refreshData();
  };

  // If user is not logged in, enforce the critical requirement:
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-6 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block mb-3">
            Authentication Required
          </span>

          <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
            Chatting Menu is Locked
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
            In Chattie, conversations are strictly protected. The chatting interface opens{' '}
            <strong className="text-slate-200">only after logging in</strong> with your permanent 5-digit Chat ID and
            password.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onRequestLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Log In with 5-Digit Chat ID</span>
            </button>

            <button
              type="button"
              onClick={onRequestRegister}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Create Account with Google</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active conversation logic
  const myConversations = conversations.filter((c) => c.participants.includes(currentUser.id));
  const activeConversation = myConversations.find((c) => c.id === activeConvId);

  // Other participant in active conversation
  const otherParticipantId = activeConversation?.participants.find((id) => id !== currentUser.id);
  const otherParticipant = users.find((u) => u.id === otherParticipantId);

  // Active messages
  const activeMessages = messages.filter((m) => m.conversationId === activeConvId);

  // Handle message send
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !activeConvId || !otherParticipantId) return;

    sendMessage({
      conversationId: activeConvId,
      senderId: currentUser.id,
      receiverId: otherParticipantId,
      text: inputText,
      imageUrl: selectedImage || undefined,
    });

    setInputText('');
    setSelectedImage(null);
    refreshData();
  };

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-5rem)]">
      <div className="h-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* LEFT COLUMN: Sidebar (Conversations & Accepted Friends) */}
        <div
          className={`w-full md:w-84 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/95 ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Inbox</h2>
            <button
              onClick={onNavigateToSearch}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Find Friends</span>
            </button>
          </div>

          {/* Pending Friend Requests notification pill */}
          {pendingRequests.length > 0 && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Friend Requests ({pendingRequests.length})</span>
                </span>
                <span className="text-[10px] text-amber-400">Incoming</span>
              </div>
              <div className="space-y-2">
                {pendingRequests.map(({ request, sender }) => (
                  <div
                    key={request.id}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={sender.avatar}
                        alt={sender.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                      />
                      <div className="min-w-0">
                        {/* ONLY NAME (NO CHAT ID) */}
                        <div className="text-xs font-bold text-white truncate">{sender.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{sender.handle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(request.id, sender.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.id)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRITICAL REQUIREMENT: Accepted Friends Bar */}
          {/* "In inbox show all users who get accepted friend request to that user show their respective account if user select any other user then chat initiate with that respective user" */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accepted Friends ({acceptedFriends.length})</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">Click to chat</span>
            </div>

            {acceptedFriends.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-slate-850/50 border border-dashed border-slate-800 text-[11px] text-slate-500">
                No accepted friends yet.{' '}
                <button
                  onClick={onNavigateToSearch}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Search accounts to connect →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {acceptedFriends.map((friend) => {
                  const isCurrentActive = otherParticipantId === friend.id;
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleInitiateChat(friend.id)}
                      className={`flex flex-col items-center p-2 rounded-2xl transition cursor-pointer shrink-0 max-w-[76px] group ${
                        isCurrentActive
                          ? 'bg-indigo-600/20 border border-indigo-500/50'
                          : 'hover:bg-slate-800/60 border border-transparent'
                      }`}
                      title={`Initiate chat with ${friend.name}`}
                    >
                      <div className="relative mb-1">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-indigo-400 transition"
                        />
                        {friend.isOnline && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"
                            title="Online"
                          />
                        )}
                      </div>
                      {/* ONLY NAME (NO CHAT ID!) */}
                      <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white truncate max-w-[70px] text-center">
                        {friend.name.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-emerald-400/80 font-medium -mt-0.5">Friend</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Sub-Tabs: Friends List First vs Messages */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setSidebarTab('friends')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === 'friends'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>My Friends ({acceptedFriends.length})</span>
            </button>
            <button
              onClick={() => setSidebarTab('all_chats')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sidebarTab === 'all_chats'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Messages ({myConversations.length})</span>
            </button>
          </div>

          {/* Filter input */}
          <div className="p-3 border-b border-slate-800/60">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Filter friends or messages..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Scrollable list based on active tab */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {sidebarTab === 'friends' ? (
              // TAB: All Accepted Friends Accounts (PRIMARY VIEW)
              <div className="p-2 space-y-1.5">
                {acceptedFriends.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-3">
                    <Users className="w-10 h-10 mx-auto text-slate-600 mb-1" />
                    <p className="text-xs font-semibold text-slate-300">No friends yet</p>
                    <p className="text-[11px] text-slate-500">Search accounts by name to send a friend request!</p>
                    <button
                      type="button"
                      onClick={onNavigateToSearch}
                      className="mt-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Search Accounts
                    </button>
                  </div>
                ) : (
                  acceptedFriends
                    .filter((f) => !convSearch || f.name.toLowerCase().includes(convSearch.toLowerCase()))
                    .map((friend) => {
                      const conv = myConversations.find((c) => c.participants.includes(friend.id));
                      const isCurrentActive = otherParticipantId === friend.id;

                      return (
                        <div
                          key={friend.id}
                          onClick={() => handleInitiateChat(friend.id)}
                          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isCurrentActive
                              ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                              : 'bg-slate-850 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={friend.avatar}
                                alt={friend.name}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-700"
                              />
                              {friend.isOnline && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                              )}
                            </div>
                            <div className="min-w-0">
                              {/* Strictly ONLY show name & handle, NO chat ID */}
                              <h4 className="text-sm font-bold text-white truncate">{friend.name}</h4>
                              <p className="text-xs text-slate-400 truncate">
                                {conv?.lastMessage?.text || friend.handle}
                              </p>
                            </div>
                          </div>

                          {/* Initiate chat button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateChat(friend.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            ) : (
              // TAB: Active Message Threads
              myConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-3">
                  <p className="text-xs">No active conversations yet.</p>
                  <p className="text-[11px] text-slate-600">
                    Select any of your accepted friends above to initiate a chat!
                  </p>
                </div>
              ) : (
                myConversations
                  .filter((conv) => {
                    if (!convSearch) return true;
                    const otherId = conv.participants.find((id) => id !== currentUser.id);
                    const otherUser = users.find((u) => u.id === otherId);
                    return (
                      otherUser?.name.toLowerCase().includes(convSearch.toLowerCase()) ||
                      conv.lastMessage?.text.toLowerCase().includes(convSearch.toLowerCase())
                    );
                  })
                  .map((conv) => {
                    const otherId = conv.participants.find((id) => id !== currentUser.id);
                    const otherUser = users.find((u) => u.id === otherId);
                    const unread = conv.unreadCount[currentUser.id] || 0;
                    const isActive = conv.id === activeConvId;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConvId(conv.id)}
                        className={`w-full p-3.5 text-left flex items-center gap-3 transition cursor-pointer ${
                          isActive ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={
                              otherUser?.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={otherUser?.name || 'Contact'}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-700 bg-slate-800"
                          />
                          {otherUser?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-white truncate">
                              {otherUser?.name || 'Unknown Contact'}
                            </h4>
                            <span className="text-[10px] text-slate-500">
                              {conv.lastMessage
                                ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">
                              {conv.lastMessage?.text || 'Start chatting...'}
                            </p>
                            {unread > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500 text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
              )
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Panel */}
        <div className={`flex-1 flex flex-col bg-slate-950 ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation && otherParticipant ? (
            <>
              {/* Active Chat Header */}
              <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                    />
                    {otherParticipant.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    )}
                  </div>

                  <div>
                    {/* CRITICAL: ONLY SHOW NAME (NO CHAT ID!) */}
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{otherParticipant.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Friend
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      {otherParticipant.isOnline ? (
                        <span className="text-emerald-400 font-medium">Online</span>
                      ) : (
                        <span>Last seen recently</span>
                      )}
                      <span>•</span>
                      <span>{otherParticipant.handle}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartVoiceCall(otherParticipant)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                    title="Start Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Voice Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartVideoCall(otherParticipant)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-400 border border-slate-700/80 hover:border-indigo-500/50 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                    title="Start Video Call"
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden sm:inline">Video Call</span>
                  </button>

                  <div className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60 hidden lg:block">
                    🔒 Encrypted
                  </div>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-950 to-slate-900/40">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      Chat initiated with {otherParticipant.name}! 🎉
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      You are accepted friends on Chattie. Send a message to start the conversation!
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={otherParticipant.avatar}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover mb-1 shrink-0"
                          />
                        )}

                        <div className={`max-w-[78%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`p-3.5 rounded-2xl shadow-md text-sm leading-relaxed ${
                              isMe
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                                : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none'
                            }`}
                          >
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                alt="Attachment"
                                className="w-full max-h-64 object-cover rounded-xl mb-2"
                              />
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>

                          <div
                            className={`flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 px-1 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && (
                              <span>
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emoji Bar */}
              <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[11px] text-slate-500 mr-1 shrink-0">Reactions:</span>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((prev) => prev + emoji)}
                    className="p-1 rounded hover:bg-slate-800 transition text-sm cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Selected Image Preview (if uploading) */}
              {selectedImage && (
                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedImage}
                      alt="Upload preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-700"
                    />
                    <span className="text-xs text-slate-300">Photo attached ready to send</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Send Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${otherParticipant.name}...`}
                    className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !selectedImage}
                    className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-xl">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Select an Accepted Friend</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-5">
                Click any of your accepted friends from the left panel to immediately initiate a private conversation.
              </p>
              {acceptedFriends.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                  {acceptedFriends.slice(0, 3).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleInitiateChat(f.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-2"
                    >
                      <img src={f.avatar} alt="" className="w-5 h-5 rounded-md object-cover" />
                      <span>Chat with {f.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToSearch}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  Search & Connect with People
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

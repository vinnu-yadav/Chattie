import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, MessageSquare, Shield, UserCheck, Sparkles, UserPlus, Clock } from 'lucide-react';
import { PublicUser, User } from '../types';
import {
  searchUsersByName,
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  getFriendRequests,
} from '../services/chatStore';

interface SearchAccountViewProps {
  currentUser: User | null;
  onStartChat: (otherUserId: string) => void;
  onRequestAuth: () => void;
}

export const SearchAccountView: React.FC<SearchAccountViewProps> = ({
  currentUser,
  onStartChat,
  onRequestAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [updateTick, setUpdateTick] = useState(0);

  // Search results strictly return PublicUser shapes (NO chatId, NO password, NO email)
  const results: PublicUser[] = useMemo(() => {
    return searchUsersByName(searchQuery, currentUser?.id);
  }, [searchQuery, currentUser, updateTick]);

  const handleSendRequest = (targetUserId: string) => {
    if (!currentUser) {
      onRequestAuth();
      return;
    }
    sendFriendRequest(currentUser.id, targetUserId);
    setUpdateTick((t) => t + 1);
  };

  const handleAcceptIncoming = (targetUserId: string) => {
    if (!currentUser) return;
    const reqs = getFriendRequests();
    const req = reqs.find((r) => r.senderId === targetUserId && r.receiverId === currentUser.id);
    if (req) {
      acceptFriendRequest(req.id);
      setUpdateTick((t) => t + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Identity Search</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Search Accounts</h1>
        <p className="text-sm text-slate-400 mt-2">
          Find and connect with friends by their display name. For your security, private 5-digit Chat IDs are never
          revealed in search results.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people by name or handle..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 shadow-xl shadow-black/20 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-slate-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      <div className="max-w-2xl mx-auto mb-6 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <strong className="text-slate-200">Chattie Privacy Policy:</strong> Search results display{' '}
          <span className="text-indigo-300 font-semibold">User Names & Avatars only</span>. Your 5-digit permanent Chat ID
          is never shared publicly.
        </div>
      </div>

      {/* Search Results Grid */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
          <span>{searchQuery ? `Matching Accounts (${results.length})` : 'Discovered People in Chattie'}</span>
          <span>Status & Action</span>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No users found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find anyone matching &ldquo;{searchQuery}&rdquo;. Try searching with a different name.
            </p>
          </div>
        ) : (
          results.map((user) => {
            const status = currentUser ? getFriendshipStatus(currentUser.id, user.id) : 'none';

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 shadow-md transition flex items-center justify-between gap-4 group"
              >
                {/* Left: Avatar & Name ONLY (No Chat ID!) */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800"
                    />
                    {user.isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"
                        title="Online"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    {/* CRITICAL: ONLY SHOW NAME (+ handle/bio) - NO CHAT ID */}
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white group-hover:text-indigo-400 transition truncate">
                        {user.name}
                      </h4>
                      {status === 'accepted' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Friend
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{user.bio || user.handle}</p>
                  </div>
                </div>

                {/* Right: Actions based on friendship status */}
                <div className="shrink-0 flex items-center gap-2">
                  {status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => onStartChat(user.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  ) : status === 'pending_sent' ? (
                    <div className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Requested</span>
                    </div>
                  ) : status === 'pending_received' ? (
                    <button
                      type="button"
                      onClick={() => handleAcceptIncoming(user.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendRequest(user.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Friend</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) onRequestAuth();
                          else onStartChat(user.id);
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-medium transition cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

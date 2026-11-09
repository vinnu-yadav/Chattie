import React from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Search,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Users,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  Camera,
} from 'lucide-react';
import { User, PublicUser } from '../types';
import { searchUsersByName, getConversations } from '../services/chatStore';

interface HomeViewProps {
  currentUser: User | null;
  onNavigateTab: (tab: 'home' | 'search' | 'inbox') => void;
  onRequestLogin: () => void;
  onRequestRegister: () => void;
  onOpenProfile: () => void;
  onStartChat: (userId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  onNavigateTab,
  onRequestLogin,
  onRequestRegister,
  onOpenProfile,
  onStartChat,
}) => {
  const suggestedPeople = searchUsersByName('', currentUser?.id).slice(0, 4);
  const conversations = getConversations();
  const myConversations = currentUser
    ? conversations.filter((c) => c.participants.includes(currentUser.id))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chattie v1.0 • Elegant & Private Messaging</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Where your conversations remain <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">private & effortless</span>.
          </h1>

          <p className="text-base text-slate-300 mb-8 leading-relaxed">
            Register with Google, receive your permanent 5-digit Chat ID, and connect with friends by name. No spam,
            no leaking IDs in searches.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTab('inbox')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Inbox ({myConversations.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateTab('search')}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition cursor-pointer flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Search Accounts</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-4 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>Upload DP</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onRequestRegister}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/20 transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onRequestLogin}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Log In with 5-Digit Chat ID</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Status Bar if logged in */}
      {currentUser && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-xl object-cover border border-indigo-500/50 bg-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{currentUser.name}</span>
                <span className="text-xs text-indigo-400 font-medium">{currentUser.handle}</span>
              </div>
              <p className="text-xs text-slate-400">
                Permanent Chat ID: <span className="font-mono font-bold text-amber-400">#{currentUser.chatId}</span> (keep
                confidential)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-medium transition cursor-pointer"
            >
              Edit Profile / DP
            </button>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold transition cursor-pointer"
            >
              Go to Inbox →
            </button>
          </div>
        </div>
      )}

      {/* 3 Core Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Search Account */}
        <div
          onClick={() => onNavigateTab('search')}
          className="p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 shadow-xl transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition">Search Account</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find contacts by name without exposing anyone&apos;s private 5-digit Chat ID. Safe, spam-resistant
              discovery.
            </p>
          </div>
          <div className="mt-5 text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition">
            <span>Search people</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 2: Inbox */}
        <div
          onClick={() => (currentUser ? onNavigateTab('inbox') : onRequestLogin())}
          className="p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/50 shadow-xl transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition">Inbox & Chatting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opens exclusively upon authenticating with your 5-digit Chat ID and password. Direct message streams with
              instant delivery.
            </p>
          </div>
          <div className="mt-5 text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition">
            <span>{currentUser ? 'Open chat threads' : 'Log in to open'}</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 3: Security & 5-Digit Chat ID */}
        <div
          onClick={() => (currentUser ? onOpenProfile() : onRequestRegister())}
          className="p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-pink-500/50 shadow-xl transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-400 transition">Profile & DP Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload custom display pictures, view your masked linked Google account, and manage your permanent login ID.
            </p>
          </div>
          <div className="mt-5 text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:translate-x-1 transition">
            <span>{currentUser ? 'Manage Profile & DP' : 'Create an account'}</span>
            <span>→</span>
          </div>
        </div>
      </div>

      {/* Suggested Contacts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Discover People on Chattie</h2>
            <p className="text-xs text-slate-400">Search accounts by name to initiate a chat.</p>
          </div>
          <button
            onClick={() => onNavigateTab('search')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            View all →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestedPeople.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center hover:border-slate-700 transition"
            >
              <div className="relative mb-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700 bg-slate-800"
                />
                {user.isOnline && (
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate max-w-full">{user.name}</h4>
              <p className="text-xs text-slate-400 truncate max-w-full mb-3">{user.handle}</p>

              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    onRequestLogin();
                  } else {
                    onStartChat(user.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

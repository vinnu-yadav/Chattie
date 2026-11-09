import React from 'react';
import { MessageSquare, Search, Home, KeyRound, UserPlus, LogOut, Shield, Sparkles } from 'lucide-react';
import { User, Conversation } from '../types';
import { logoutUser } from '../services/chatStore';

interface NavbarProps {
  currentTab: 'home' | 'search' | 'inbox';
  onSelectTab: (tab: 'home' | 'search' | 'inbox') => void;
  currentUser: User | null;
  conversations: Conversation[];
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  conversations,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onLogout,
}) => {
  // Calculate total unread count for current user
  const totalUnread = currentUser
    ? conversations
        .filter((c) => c.participants.includes(currentUser.id))
        .reduce((sum, c) => sum + (c.unreadCount[currentUser.id] || 0), 0)
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-5 h-5 fill-indigo-400/20" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              Chattie
              <span className="w-2 h-2 rounded-full bg-pink-500" />
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide -mt-1">
              Private 5-Digit Chat
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Opening of App shows Search Account, Home, and Inbox) */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Home */}
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              currentTab === 'home'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Search Account */}
          <button
            onClick={() => onSelectTab('search')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              currentTab === 'search'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search Account</span>
          </button>

          {/* Inbox */}
          <button
            onClick={() => onSelectTab('inbox')}
            className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              currentTab === 'inbox'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Inbox</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-pink-500 text-white animate-pulse">
                {totalUnread}
              </span>
            )}
          </button>
        </nav>

        {/* User Account & Auth Section */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Profile Pill with 5-digit Chat ID badge */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                title="View Profile and DP"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover border border-indigo-500/40 bg-slate-800"
                />
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white truncate max-w-[100px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 font-semibold">
                    #{currentUser.chatId}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  onLogout();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={onOpenRegister}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

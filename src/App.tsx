/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { SearchAccountView } from './components/SearchAccountView';
import { InboxView } from './components/InboxView';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { LoginModal } from './components/LoginModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ProfileModal } from './components/ProfileModal';
import { User, Conversation } from './types';
import {
  getCurrentUser,
  getConversations,
  subscribeToStore,
  getUsers,
  loginWithChatId,
} from './services/chatStore';
import { Sparkles, Shield, UserCheck, KeyRound } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'inbox'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTargetUserId, setActiveTargetUserId] = useState<string | null>(null);

  // Modals state
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [prefilledChatId, setPrefilledChatId] = useState<string>('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state from store
  const syncState = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setConversations(getConversations());
  };

  useEffect(() => {
    syncState();
    const unsubscribe = subscribeToStore(() => {
      syncState();
    });
    return unsubscribe;
  }, []);

  // Handlers for switching between auth modals
  const handleOpenLoginWithId = (chatId?: string) => {
    setIsGoogleAuthOpen(false);
    setIsForgotPasswordOpen(false);
    setPrefilledChatId(chatId || '');
    setIsLoginOpen(true);
  };

  const handleOpenRegister = () => {
    setIsLoginOpen(false);
    setIsForgotPasswordOpen(false);
    setIsGoogleAuthOpen(true);
  };

  const handleOpenForgotPassword = (chatId?: string) => {
    setIsLoginOpen(false);
    setIsGoogleAuthOpen(false);
    setPrefilledChatId(chatId || '');
    setIsForgotPasswordOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginOpen(false);
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      showToast(`Welcome back, ${user.name}! 💬`);
      setCurrentTab('inbox');
    }
  };

  const handleStartChatWithUser = (targetUserId: string) => {
    setActiveTargetUserId(targetUserId);
    setCurrentTab('inbox');
  };

  const handleQuickSwitchUser = (chatId: string) => {
    const res = loginWithChatId(chatId, 'password123');
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast(`Switched account to ${res.user.name} (#${res.user.chatId})`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        conversations={conversations}
        onOpenLogin={() => handleOpenLoginWithId()}
        onOpenRegister={handleOpenRegister}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          showToast('You have been logged out.');
        }}
      />

      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-medium border border-indigo-400/40 animate-slide-up">
          <Sparkles className="w-4 h-4 text-pink-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content by Active Tab */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <HomeView
            currentUser={currentUser}
            onNavigateTab={setCurrentTab}
            onRequestLogin={() => handleOpenLoginWithId()}
            onRequestRegister={handleOpenRegister}
            onOpenProfile={() => setIsProfileOpen(true)}
            onStartChat={handleStartChatWithUser}
          />
        )}

        {currentTab === 'search' && (
          <SearchAccountView
            currentUser={currentUser}
            onStartChat={handleStartChatWithUser}
            onRequestAuth={() => handleOpenLoginWithId()}
          />
        )}

        {currentTab === 'inbox' && (
          <InboxView
            currentUser={currentUser}
            activeTargetUserId={activeTargetUserId}
            onRequestLogin={() => handleOpenLoginWithId()}
            onRequestRegister={handleOpenRegister}
            onNavigateToSearch={() => setCurrentTab('search')}
          />
        )}
      </main>

      {/* Bottom Testing Bar for easy instant tester account switcher */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 px-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>
            Chattie • All search results protect Chat IDs. Login only via permanent 5-digit Chat ID & password.
          </span>
        </div>

        {/* Quick test switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Quick Test:</span>
          <button
            onClick={() => handleQuickSwitchUser('74129')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono cursor-pointer transition"
            title="Log in as Sophia (#74129)"
          >
            Sophia #74129
          </button>
          <button
            onClick={() => handleQuickSwitchUser('82045')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono cursor-pointer transition"
            title="Log in as Marcus (#82045)"
          >
            Marcus #82045
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Google Authentication & Registration Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        onOpenLogin={handleOpenLoginWithId}
        onOpenForgotPassword={handleOpenForgotPassword}
        userEmail="vinayytmadduri@gmail.com"
      />

      {/* 2. Login Modal (5-digit Chat ID & Password only) */}
      <LoginModal
        isOpen={isLoginOpen}
        initialChatId={prefilledChatId}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onOpenRegister={handleOpenRegister}
        onOpenForgotPassword={handleOpenForgotPassword}
      />

      {/* 3. Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialChatId={prefilledChatId}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={(chatId) => handleOpenLoginWithId(chatId)}
      />

      {/* 4. Profile & DP Upload Modal */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          user={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            showToast('Profile updated!');
          }}
          onLogout={() => {
            setIsProfileOpen(false);
            setCurrentUser(null);
            showToast('Logged out.');
          }}
        />
      )}
    </div>
  );
}

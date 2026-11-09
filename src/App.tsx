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
import { User, Conversation, PublicUser } from './types';
import {
  getCurrentUser,
  getConversations,
  subscribeToStore,
  getUsers,
  loginWithChatId,
} from './services/chatStore';
import {
  ActiveCall,
  CallType,
  webrtc,
  ringtone,
  subscribeToCalls,
  broadcastCallEvent,
} from './services/callService';
import {
  showMessageNotification,
  showCallNotification,
  requestNotificationPermission,
} from './services/notificationService';
import { IncomingCallModal } from './components/IncomingCallModal';
import { CallModal } from './components/CallModal';
import { MediaPermissionModal } from './components/MediaPermissionModal';
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
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  // Calling state
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);
  const [callNotificationObj, setCallNotificationObj] = useState<Notification | null>(null);

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
    const unsubscribe = subscribeToStore((type, data) => {
      syncState();
      // If a new message arrived and it is for current user, fire notification
      if (type === 'messages_updated') {
        const user = getCurrentUser();
        if (user && data && data.receiverId === user.id) {
          const sender = getUsers().find((u) => u.id === data.senderId);
          showMessageNotification(sender?.name || 'Friend', data.text, sender?.avatar);
        }
      }
    });
    return unsubscribe;
  }, []);

  // WebRTC Calling Signal Listener
  useEffect(() => {
    const unsubscribeCalls = subscribeToCalls(async ({ type, payload }) => {
      const user = getCurrentUser();
      if (!user) return;

      if (type === 'call_initiated') {
        // Someone is calling current user
        if (payload.receiverId === user.id) {
          setIncomingCall(payload);
          // Ring call like Instagram (Web Audio API chime synthesized)
          ringtone.start();
          const notif = showCallNotification(payload.callerName, payload.callType, payload.callerAvatar);
          if (notif) setCallNotificationObj(notif);
        }
      } else if (type === 'call_accepted') {
        // Caller receives acceptance from receiver
        if (activeCall && activeCall.callId === payload.callId) {
          ringtone.stop();
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null));
          showToast(`Call connected with ${payload.receiverName}! 🟢`);
        }
      } else if (type === 'call_declined') {
        if ((activeCall && activeCall.callId === payload.callId) || (incomingCall && incomingCall.callId === payload.callId)) {
          ringtone.stop();
          webrtc.stopMedia();
          setActiveCall(null);
          setIncomingCall(null);
          if (callNotificationObj) {
            callNotificationObj.close();
            setCallNotificationObj(null);
          }
          showToast('Call was declined or missed.');
        }
      } else if (type === 'call_ended') {
        if ((activeCall && activeCall.callId === payload.callId) || (incomingCall && incomingCall.callId === payload.callId)) {
          ringtone.stop();
          webrtc.stopMedia();
          setActiveCall(null);
          setIncomingCall(null);
          if (callNotificationObj) {
            callNotificationObj.close();
            setCallNotificationObj(null);
          }
          showToast('Call ended.');
        }
      } else if (type === 'webrtc_offer') {
        if (incomingCall && incomingCall.callId === payload.callId && payload.receiverId === user.id) {
          try {
            const answer = await webrtc.handleOffer(payload.offer);
            broadcastCallEvent('webrtc_answer', {
              callId: payload.callId,
              answer,
              callerId: payload.callerId,
            });
          } catch (e) {
            console.warn('Error handling webrtc offer:', e);
          }
        }
      } else if (type === 'webrtc_answer') {
        if (activeCall && activeCall.callId === payload.callId && payload.callerId === user.id) {
          try {
            await webrtc.handleAnswer(payload.answer);
          } catch (e) {
            console.warn('Error handling webrtc answer:', e);
          }
        }
      } else if (type === 'webrtc_ice') {
        if (
          (activeCall && activeCall.callId === payload.callId) ||
          (incomingCall && incomingCall.callId === payload.callId)
        ) {
          try {
            await webrtc.addIceCandidate(payload.candidate);
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
      }
    });

    return () => {
      unsubscribeCalls();
      ringtone.stop();
      webrtc.stopMedia();
    };
  }, [activeCall, incomingCall, callNotificationObj]);

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

  // Start outgoing Voice or Video Call
  const handleStartCall = async (targetUser: User | PublicUser, callType: CallType) => {
    if (!currentUser) {
      handleOpenLoginWithId();
      return;
    }

    try {
      // 1. Get user media (mic & camera if video)
      await webrtc.initLocalStream(callType);

      const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      const newCall: ActiveCall = {
        callId,
        callerId: currentUser.id,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar,
        receiverId: targetUser.id,
        receiverName: targetUser.name,
        receiverAvatar: targetUser.avatar,
        callType,
        status: 'outgoing',
      };

      // 2. Setup WebRTC peer connection
      webrtc.createPeerConnection(
        (_stream) => {
          // Remote stream received
        },
        (candidate) => {
          broadcastCallEvent('webrtc_ice', {
            callId,
            candidate,
            senderId: currentUser.id,
          });
        }
      );

      // 3. Create offer
      const offer = await webrtc.createOffer();

      // 4. Broadcast call initiation & WebRTC offer
      broadcastCallEvent('call_initiated', newCall);
      broadcastCallEvent('webrtc_offer', {
        callId,
        callerId: currentUser.id,
        receiverId: targetUser.id,
        offer,
      });

      setActiveCall(newCall);
      showToast(`Calling ${targetUser.name}... 📞`);
    } catch (err: any) {
      console.warn('Could not start call:', err);
      setIsPermissionModalOpen(true);
    }
  };

  // Accept incoming call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall || !currentUser) return;
    ringtone.stop();
    if (callNotificationObj) {
      callNotificationObj.close();
      setCallNotificationObj(null);
    }

    try {
      await webrtc.initLocalStream(incomingCall.callType);
      webrtc.createPeerConnection(
        (_stream) => {},
        (candidate) => {
          broadcastCallEvent('webrtc_ice', {
            callId: incomingCall.callId,
            candidate,
            senderId: currentUser.id,
          });
        }
      );

      const acceptedCall: ActiveCall = {
        ...incomingCall,
        status: 'connected',
        startedAt: Date.now(),
      };

      setActiveCall(acceptedCall);
      setIncomingCall(null);

      broadcastCallEvent('call_accepted', acceptedCall);
    } catch (err) {
      console.warn('Error accepting call:', err);
      setIsPermissionModalOpen(true);
    }
  };

  // Decline incoming call
  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    ringtone.stop();
    if (callNotificationObj) {
      callNotificationObj.close();
      setCallNotificationObj(null);
    }
    broadcastCallEvent('call_declined', { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  // End active call
  const handleEndCall = () => {
    if (activeCall) {
      broadcastCallEvent('call_ended', { callId: activeCall.callId });
      setActiveCall(null);
    }
    ringtone.stop();
    webrtc.stopMedia();
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
            onStartVoiceCall={(targetUser) => handleStartCall(targetUser, 'voice')}
            onStartVideoCall={(targetUser) => handleStartCall(targetUser, 'video')}
          />
        )}
      </main>

      {/* Bottom status bar */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-3 px-4 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>
            Chattie • All search results protect Chat IDs. Login only via permanent 5-digit Chat ID & password.
          </span>
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

      {/* 5. Permission Modal for Camera, Mic & Notifications */}
      <MediaPermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        onGranted={() => {
          setIsPermissionModalOpen(false);
          showToast('Permissions granted for voice/video calls! 🎙️🎥');
        }}
      />

      {/* 6. Instagram-style Incoming Call Overlay Modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* 7. Full-Screen WebRTC Voice / Video Call Modal */}
      {activeCall && (
        <CallModal
          call={activeCall}
          isCaller={activeCall.callerId === currentUser?.id}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}

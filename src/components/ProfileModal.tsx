import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Check, Copy, Shield, LogOut, Sparkles, User as UserIcon, Mail } from 'lucide-react';
import { User } from '../types';
import { updateUserProfile, logoutUser } from '../services/chatStore';

interface ProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onUserUpdated: (updated: User) => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUserUpdated,
  onLogout,
}) => {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [copiedId, setCopiedId] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setHandle(user.handle);
      setBio(user.bio || '');
      setAvatar(user.avatar);
      setSavedSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateUserProfile(user.id, {
      name,
      handle,
      bio,
      avatar,
    });

    if (result.success && result.user) {
      onUserUpdated(result.user);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const copyChatId = () => {
    navigator.clipboard.writeText(user.chatId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 max-h-[88vh] overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-1">Account & Profile (DP)</h2>
          <p className="text-xs text-slate-400 mb-6">
            Manage your display picture, profile information, and private 5-digit Chat ID.
          </p>

          {/* 5-Digit Chat ID Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Your Permanent 5-Digit Chat ID</span>
              </div>
              <div className="text-2xl font-mono font-extrabold text-white mt-1 tracking-wider">
                #{user.chatId}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Hidden in user searches. Only used for your private login.
              </div>
            </div>

            <button
              type="button"
              onClick={copyChatId}
              className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* DP (Display Picture) Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Display Picture (DP)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={avatar}
                    alt="Current DP"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/80 shadow-md bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                    title="Change DP"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload New DP</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">or choose from presets:</div>
                  <div className="flex gap-2">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setAvatar(preset)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border transition ${
                          avatar === preset ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Handle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Handle</label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Linked Google Email (read-only for security) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Linked Google Account</span>
              </label>
              <input
                type="text"
                disabled
                value={user.googleEmail}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used for password recovery and account verification.</p>
            </div>

            {/* About / Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bio / Status</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Profile and DP updated successfully!</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                Save Changes
              </button>

              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  onLogout();
                }}
                className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

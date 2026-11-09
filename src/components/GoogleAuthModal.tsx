import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Check, Copy, AlertCircle, Sparkles, Upload, Shield, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { checkGoogleUserExists, registerUser } from '../services/chatStore';
import { User } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: (prefilledChatId?: string) => void;
  onOpenForgotPassword: (prefilledChatId?: string) => void;
  userEmail?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenForgotPassword,
  userEmail = 'vinayytmadduri@gmail.com',
}) => {
  // Steps: 'google_signin' | 'already_exists' | 'create_credentials' | 'celebration'
  const [step, setStep] = useState<
    'google_signin' | 'already_exists' | 'create_credentials' | 'celebration'
  >('google_signin');

  // Authenticated Google account details
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Profile creation details
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState('Hey there! I am using Chattie 💬');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);

  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingUserChatId, setExistingUserChatId] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      setStep('google_signin');
      setError(null);
      setCreatedUser(null);
      setCopiedId(false);
      setPassword('');
      setConfirmPassword('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Google Sign-In for new users using Native Device Google Account Chooser
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    let authenticatedEmail = '';
    let authenticatedDisplayName = '';
    let authenticatedPhoto: string | null = null;

    try {
      // 1. Try Native Android Google Account Picker via GoogleAuth plugin
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      try {
        await GoogleAuth.initialize({
          clientId: '323750725817-9q4k308ras1pls9jej7fs7cvaq35n9vp.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        const googleUser = await GoogleAuth.signIn();
        if (googleUser && googleUser.email) {
          authenticatedEmail = googleUser.email;
          authenticatedDisplayName = googleUser.name || (googleUser as any).displayName || googleUser.email.split('@')[0];
          authenticatedPhoto = googleUser.imageUrl;
        }
      } catch (nativeErr: any) {
        console.warn('Native GoogleAuth notice, attempting standard Firebase popup:', nativeErr);
        // 2. Fallback to Firebase Google Provider popup
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user.email) {
          authenticatedEmail = result.user.email;
          authenticatedDisplayName = result.user.displayName || result.user.email.split('@')[0];
          authenticatedPhoto = result.user.photoURL;
        }
      }
    } catch (popupErr: any) {
      console.warn('Google sign-in error:', popupErr?.message || popupErr);
      setError('Unable to sign in with Google account. Please ensure Google Play Services is enabled on your device.');
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }

    if (!authenticatedEmail) {
      setError('No Google account was selected. Please tap Sign In with Google and choose your account.');
      return;
    }

    setGoogleEmail(authenticatedEmail);
    setGoogleName(authenticatedDisplayName);
    if (authenticatedPhoto) {
      setAvatar(authenticatedPhoto);
    }

    // Capitalize display name
    const formattedName = authenticatedDisplayName
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    setName(formattedName);
    setHandle('@' + authenticatedEmail.split('@')[0].toLowerCase().slice(0, 15).replace(/[^a-z0-9_]/g, ''));

    // Check if user already exists
    const { exists, existingUser } = checkGoogleUserExists(authenticatedEmail);
    if (exists && existingUser) {
      setExistingUserChatId(existingUser.chatId);
      setStep('already_exists');
    } else {
      setStep('create_credentials');
    }
  };

  // Handle custom DP file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit registration: creates password, handle, DP, and generates unique 5-digit Chat ID
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a full display name.');
      return;
    }
    if (!handle.trim()) {
      setError('Please provide a unique handle.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = registerUser({
      googleEmail,
      googleName,
      name,
      handle,
      password,
      avatar,
      bio,
    });

    if (!result.success || !result.user) {
      setError(result.error || 'Failed to create account.');
      return;
    }

    setCreatedUser(result.user);
    setStep('celebration');

    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899', '#10b981'],
      });
    } catch {
      // Safe fallback
    }
  };

  const copyChatIdToClipboard = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(createdUser.chatId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100"
      >
        {/* Header gradient bar */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">
          {/* STEP 1: REAL GOOGLE SIGN-IN FOR NEW USERS (No fixed accounts) */}
          {step === 'google_signin' && (
            <div className="text-center py-2">
              {/* Google official 'G' icon */}
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xl mx-auto flex items-center justify-center mb-4">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Create Account with Google</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-7">
                Sign in with your Google account to get started. You will receive a unique, permanent 5-digit Chat ID.
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Dynamic Google Sign-In Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-4 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base shadow-xl flex items-center justify-center gap-3 transition cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>

              <div className="mt-7 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Already registered with your 5-digit Chat ID?</span>
                <button
                  type="button"
                  onClick={() => onOpenLogin()}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer"
                >
                  Log In →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2A: ALREADY EXISTS NOTICE */}
          {step === 'already_exists' && (
            <div className="text-center py-2">
              <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">User Already Exists!</h3>
              <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6">
                An account linked to <span className="text-amber-300 font-medium">{googleEmail}</span> is already
                registered in Chattie.
              </p>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-left mb-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>How to access your account:</span>
                </div>
                <p>
                  Per Chattie security guidelines, you log in using your permanent{' '}
                  <span className="text-indigo-300 font-semibold">5-digit Chat ID</span> and password.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onOpenLogin(existingUserChatId || undefined)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 transition cursor-pointer"
                >
                  Proceed to Login with Chat ID
                </button>

                <button
                  type="button"
                  onClick={() => onOpenForgotPassword(existingUserChatId || undefined)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Forgot your Password?
                </button>

                <button
                  type="button"
                  onClick={() => setStep('google_signin')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  ← Sign in with a different Google account
                </button>
              </div>
            </div>
          )}

          {/* STEP 2B: CREATE PASSWORD, HANDLE & DP */}
          {step === 'create_credentials' && (
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>Google Account: {googleEmail}</span>
                </div>
                <h3 className="text-xl font-bold text-white">Create Your Password & Handle</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your handle and a password. A permanent 5-digit Chat ID will be generated upon submission.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRegistration} className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                {/* DP (Display Picture) Upload & Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Profile Display Picture (DP)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <img
                        src={avatar}
                        alt="DP Preview"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                        title="Upload Custom DP"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload DP
                        </button>
                        <span className="text-[11px] text-slate-400">or pick avatar:</span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setAvatar(preset)}
                            className={`w-7 h-7 rounded-lg overflow-hidden border transition shrink-0 ${
                              avatar === preset ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vinay Madduri"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    This is what other users see when they search for you.
                  </p>
                </div>

                {/* Handle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Handle (Username) <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={handle.replace(/^@/, '')}
                      onChange={(e) => setHandle('@' + e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Create Password <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Bio / Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">About / Status</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short bio or status"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Submit & Generate 5-Digit Chat ID
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: CELEBRATION & 5-DIGIT CHAT ID REVEAL */}
          {step === 'celebration' && createdUser && (
            <div className="text-center py-2">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">Account Created! 🎉</h3>
              <p className="text-xs text-slate-300 mb-5">
                Here is your permanent and unique Chattie numeric ID. Save it in a safe place!
              </p>

              {/* 5-Digit Chat ID Badge */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10 mb-5 relative overflow-hidden">
                <div className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-2">
                  Your Permanent 5-Digit Chat ID
                </div>

                {/* 5 large digits */}
                <div className="flex justify-center items-center gap-2.5 my-3">
                  {createdUser.chatId.split('').map((digit: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-12 h-16 rounded-xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-3xl font-mono font-extrabold text-white shadow-inner"
                    >
                      {digit}
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={copyChatIdToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-medium transition cursor-pointer"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copied to Clipboard!' : 'Copy Chat ID'}</span>
                  </button>
                </div>
              </div>

              {/* Security rule notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left mb-6 text-xs text-amber-200/90 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Shield className="w-4 h-4" />
                  <span>Important Privacy Notice:</span>
                </div>
                <p>
                  As per Chattie security design, <strong className="text-white">no chatting opens during creation</strong>.
                  To enter the chatting menu, you must now log in using your <strong className="text-white">5-digit Chat ID</strong> and your selected password.
                </p>
              </div>

              {/* Action Button: Proceed to Login */}
              <button
                type="button"
                onClick={() => onOpenLogin(createdUser.chatId)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold text-base shadow-xl shadow-teal-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Login with Chat ID</span>
                <span className="text-lg">→</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

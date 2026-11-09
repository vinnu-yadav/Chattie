import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, KeyRound, Lock, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, HelpCircle } from 'lucide-react';
import { loginWithChatId } from '../services/chatStore';

interface LoginModalProps {
  isOpen: boolean;
  initialChatId?: string;
  onClose: () => void;
  onSuccess: () => void;
  onOpenRegister: () => void;
  onOpenForgotPassword: (prefilledChatId?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  initialChatId = '',
  onClose,
  onSuccess,
  onOpenRegister,
  onOpenForgotPassword,
}) => {
  const [chatId, setChatId] = useState(initialChatId);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialChatId) {
        setChatId(initialChatId);
      }
      setError(null);
      setPassword('');
    }
  }, [isOpen, initialChatId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = chatId.trim();
    if (!/^\d{5}$/.test(cleanId)) {
      setError('Chat ID must be exactly a 5-digit number (e.g. 48291).');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Simulate crisp authentic auth check
    setTimeout(() => {
      const result = loginWithChatId(cleanId, password);
      setIsLoading(false);

      if (!result.success) {
        setError(result.error || 'Invalid credentials.');
        return;
      }

      onSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100"
      >
        {/* Glow accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Log In to Chattie</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access your chat inbox using your permanent 5-digit Chat ID and password.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('password') && (
                  <button
                    type="button"
                    onClick={() => onOpenForgotPassword(chatId)}
                    className="block mt-1 text-indigo-400 hover:underline font-semibold"
                  >
                    Reset Password via linked Google Email →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 5-digit Chat ID input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  5-Digit Chat ID <span className="text-indigo-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">Numeric Only</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  required
                  value={chatId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                    setChatId(val);
                    setError(null);
                  }}
                  placeholder="e.g. 74129"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition text-center"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 text-center">
                Your permanent Chat ID assigned during account creation.
              </p>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => onOpenForgotPassword(chatId)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || chatId.length !== 5 || !password}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In to Chattie</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>



          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Don&apos;t have an account yet? </span>
            <button
              type="button"
              onClick={onOpenRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer"
            >
              Create Account with Google →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

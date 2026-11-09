import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Search, Mail, KeyRound, Check, AlertCircle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { findAccountForReset, resetUserPassword } from '../services/chatStore';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialChatId?: string;
  onClose: () => void;
  onSuccessLogin: (chatId: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialChatId = '',
  onClose,
  onSuccessLogin,
}) => {
  // Steps: 'search' | 'account_found' | 'email_sent' | 'reset_success'
  const [step, setStep] = useState<'search' | 'account_found' | 'email_sent' | 'reset_success'>('search');
  const [chatId, setChatId] = useState(initialChatId);
  const [accountInfo, setAccountInfo] = useState<{ name: string; maskedEmail: string; fullEmail: string } | null>(null);

  // Reset form states
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setChatId(initialChatId || '');
      setAccountInfo(null);
      setError(null);
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      if (initialChatId && initialChatId.length === 5) {
        handleSearch(initialChatId);
      }
    }
  }, [isOpen, initialChatId]);

  if (!isOpen) return null;

  const handleSearch = (idToSearch?: string) => {
    setError(null);
    const targetId = (idToSearch || chatId).trim();

    if (!/^\d{5}$/.test(targetId)) {
      setError('Please enter a valid 5-digit numeric Chat ID (e.g. 74129).');
      return;
    }

    const result = findAccountForReset(targetId);
    if (!result.found || !result.userSummary) {
      setError(result.error || 'No account found with this 5-digit Chat ID.');
      setAccountInfo(null);
      return;
    }

    setAccountInfo(result.userSummary);
    setStep('account_found');
  };

  const handleSendResetEmail = () => {
    if (!accountInfo) return;
    setIsSending(true);
    setError(null);

    // Generate realistic 6-digit recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setVerificationCode(code); // prefilled for seamless demo testing

    setTimeout(() => {
      setIsSending(false);
      setStep('email_sent');
    }, 600);
  };

  const handleCompletePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.trim() !== generatedCode) {
      setError('Invalid verification code. Please check your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = resetUserPassword(chatId, newPassword);
    if (!result.success) {
      setError(result.error || 'Failed to reset password.');
      return;
    }

    setStep('reset_success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Password Recovery</h2>
            <p className="text-xs text-slate-400 mt-1">
              Search your account by 5-digit Chat ID and send a reset link to your linked Google email.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* STEP 1: Search by 5-digit Chat ID */}
          {step === 'search' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Your 5-Digit Chat ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={chatId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                      setChatId(val);
                      setError(null);
                    }}
                    placeholder="e.g. 74129"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition text-center"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  Enter the 5-digit numeric ID assigned to your account.
                </p>
              </div>

              <button
                type="button"
                disabled={chatId.length !== 5}
                onClick={() => handleSearch()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Account</span>
              </button>
            </div>
          )}

          {/* STEP 2: Account Found, Send to Google Email */}
          {step === 'account_found' && accountInfo && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-xs text-slate-400">Account Found:</span>
                  <span className="text-xs font-semibold text-white">{accountInfo.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-xs text-slate-400">5-Digit Chat ID:</span>
                  <span className="text-xs font-mono font-bold text-amber-400">#{chatId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Linked Google Email:</span>
                  <span className="text-xs font-medium text-indigo-300">{accountInfo.maskedEmail}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSending}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Reset Password to Linked Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('search')}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition"
              >
                ← Search with a different Chat ID
              </button>
            </div>
          )}

          {/* STEP 3: Email Dispatched & Set New Password */}
          {step === 'email_sent' && accountInfo && (
            <form onSubmit={handleCompletePasswordReset} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>Reset link dispatched!</span>
                </div>
                <p>
                  We simulated sending instructions to <strong className="text-white">{accountInfo.maskedEmail}</strong>.
                  For test speed, your verification code has been pre-filled below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Verification Code (from Google Email)
                </label>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-center tracking-widest text-white text-base focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Save New Password & Finish</span>
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {step === 'reset_success' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Password Reset Successfully!</h3>
              <p className="text-xs text-slate-300">
                Your password for Chat ID <strong className="text-amber-400 font-mono">#{chatId}</strong> has been updated.
                You can now log in with your updated credentials.
              </p>

              <button
                type="button"
                onClick={() => onSuccessLogin(chatId)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition cursor-pointer"
              >
                Log In Now with Chat ID #{chatId}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

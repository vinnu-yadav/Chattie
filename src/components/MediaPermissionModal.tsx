import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Mic, Shield, Check, X, Bell } from 'lucide-react';
import { requestNotificationPermission } from '../services/notificationService';

interface MediaPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted: () => void;
}

export const MediaPermissionModal: React.FC<MediaPermissionModalProps> = ({
  isOpen,
  onClose,
  onGranted,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGrant = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      // Stop stream immediately once granted
      stream.getTracks().forEach((track) => track.stop());

      // Also request notification permission for incoming messages and calls
      await requestNotificationPermission();

      setIsRequesting(false);
      onGranted();
    } catch (err: any) {
      console.warn('Media permission notice:', err);
      // If video failed, attempt audio-only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getTracks().forEach((t) => t.stop());
        await requestNotificationPermission();
        setIsRequesting(false);
        onGranted();
      } catch (err2) {
        setIsRequesting(false);
        setError('Permissions were dismissed or unavailable. You can still grant them anytime.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative text-slate-100 p-7 text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center items-center gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Camera className="w-6 h-6" />
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner">
            <Mic className="w-6 h-6" />
          </div>
          <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-inner">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Enable Calls & Notifications</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
          Chattie uses WebRTC for full-screen voice & video calls. Allow camera, microphone, and message
          notifications so you receive calls and messages in real time.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleGrant}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRequesting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Allow Camera, Mic & Notifications</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </div>
  );
};

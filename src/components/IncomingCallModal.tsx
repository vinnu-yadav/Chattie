import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, Mic, Sparkles } from 'lucide-react';
import { ActiveCall, ringtone } from '../services/callService';

interface IncomingCallModalProps {
  call: ActiveCall;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAccept,
  onDecline,
}) => {
  // Start Instagram-style ringtone upon mounting and stop on unmount
  useEffect(() => {
    ringtone.start();
    return () => {
      ringtone.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-slate-700/80 rounded-3xl shadow-2xl p-8 text-center text-white relative overflow-hidden"
      >
        {/* Subtle glowing ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Calling Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-semibold text-indigo-300 mb-6 shadow-sm">
          {call.callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Pulsing Avatar (Instagram Call Style) */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          {/* Animated concentric rings */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute -inset-2 rounded-full border-2 border-indigo-400/40 animate-pulse" />

          <img
            src={call.callerAvatar}
            alt={call.callerName}
            className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-2xl relative z-10"
          />
        </div>

        {/* Caller Info */}
        <h3 className="text-2xl font-extrabold text-white tracking-tight mb-1">{call.callerName}</h3>
        <p className="text-xs text-indigo-300/80 mb-8 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Chattie End-to-End Encrypted Call</span>
        </p>

        {/* Instagram-style Call Controls: Accept & Decline */}
        <div className="flex items-center justify-center gap-8">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onDecline}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition cursor-pointer"
              title="Decline Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-slate-400 font-medium">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-bounce transition cursor-pointer"
              title="Accept Call"
            >
              <Phone className="w-7 h-7" />
            </button>
            <span className="text-xs text-emerald-400 font-semibold">Accept</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

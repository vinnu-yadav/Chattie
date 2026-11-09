import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Sparkles,
  Volume2,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { ActiveCall, webrtc, CallType } from '../services/callService';

interface CallModalProps {
  call: ActiveCall;
  isCaller: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ call, isCaller, onEndCall }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.callType === 'voice');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Other person's details
  const otherName = isCaller ? call.receiverName : call.callerName;
  const otherAvatar = isCaller ? call.receiverAvatar : call.callerAvatar;

  // Call timer
  useEffect(() => {
    let timer: any = null;
    if (call.status === 'connected') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [call.status]);

  // Request browser fullscreen if allowed
  useEffect(() => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }
    } catch {}

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Attach local and remote media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && webrtc.localStream) {
      localVideoRef.current.srcObject = webrtc.localStream;
    }
  }, [webrtc.localStream, isVideoOff]);

  useEffect(() => {
    if (remoteVideoRef.current && webrtc.remoteStream) {
      remoteVideoRef.current.srcObject = webrtc.remoteStream;
      const videoTracks = webrtc.remoteStream.getVideoTracks();
      setHasRemoteVideo(videoTracks.length > 0 && videoTracks[0].enabled);
    }
  }, [webrtc.remoteStream, call.status]);

  // Toggle Mute
  const handleToggleMute = () => {
    if (webrtc.localStream) {
      const audioTracks = webrtc.localStream.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !t.enabled));
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video
  const handleToggleVideo = () => {
    if (webrtc.localStream) {
      const videoTracks = webrtc.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((t) => (t.enabled = !t.enabled));
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden select-none animate-fade-in text-white">
      {/* Background for Video Call vs Voice Call */}
      {call.callType === 'video' ? (
        <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream - No mirror effect */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ transform: 'none' }}
            className={`w-full h-full object-cover select-none ${hasRemoteVideo ? 'block' : 'hidden'}`}
          />

          {/* Fallback if remote video is inactive or connecting */}
          {!hasRemoteVideo && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                <div className="w-36 h-36 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-ping absolute inset-0" />
                <img
                  src={otherAvatar}
                  alt={otherName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500/50 shadow-2xl relative z-10"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{otherName}</h3>
              <p className="text-sm text-indigo-300">
                {call.status === 'connected' ? 'Connected (Camera off)' : 'Connecting secure video stream...'}
              </p>
            </div>
          )}

          {/* Local User PiP (Picture in Picture) Video preview - explicitly NO mirror effect (natural un-mirrored real camera orientation) */}
          {!isVideoOff && (
            <motion.div
              drag
              dragConstraints={{ left: 10, right: 300, top: 10, bottom: 400 }}
              className="absolute top-6 right-6 z-30 w-36 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-900 cursor-move"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: 'none' }}
                className="w-full h-full object-cover select-none"
              />
              <span className="absolute bottom-1 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-slate-300">
                You (Natural view)
              </span>
            </motion.div>
          )}
        </div>
      ) : (
        /* VOICE CALL FULLSCREEN UI */
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6">
          <div className="relative flex items-center justify-center mb-8">
            {/* Animated pulsating sound waves */}
            <div className="w-56 h-56 rounded-full bg-indigo-500/10 animate-ping absolute" />
            <div className="w-48 h-48 rounded-full border border-indigo-500/30 animate-pulse absolute" />
            <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 blur-xl absolute" />

            <img
              src={otherAvatar}
              alt={otherName}
              className="w-36 h-36 rounded-full object-cover border-4 border-slate-800 shadow-2xl relative z-10"
            />
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">{otherName}</h2>
          <div className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>
              {call.status === 'connected' ? `In Voice Call • ${formatTime(duration)}` : 'Ringing...'}
            </span>
          </div>
        </div>
      )}

      {/* TOP BAR: Info & Fullscreen Toggle */}
      <div className="relative z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{call.callType === 'video' ? 'Full Screen Video Call' : 'Full Screen Voice Call'}</span>
          </div>
          <div className="text-xs text-slate-300 font-mono hidden sm:block">
            {call.status === 'connected' ? formatTime(duration) : 'Calling...'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* BOTTOM CONTROLS BAR */}
      <div className="relative z-20 p-8 flex items-center justify-center gap-5 sm:gap-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {/* Mute Button */}
        <button
          type="button"
          onClick={handleToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-xl cursor-pointer ${
            isMuted
              ? 'bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500'
              : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Video Toggle Button (for video calls) */}
        {call.callType === 'video' && (
          <button
            type="button"
            onClick={handleToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-xl cursor-pointer ${
              isVideoOff
                ? 'bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500'
                : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 transition cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

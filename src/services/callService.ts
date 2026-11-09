/**
 * WebRTC Voice & Video Call Service with Instagram-style Ringtone & Signaling
 */

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended';

export interface ActiveCall {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: number;
}

// WebRTC STUN servers
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Instagram-style Call Ringtone Synthesizer using Web Audio API
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.isPlaying = true;

      // Instagram-style double chime chime
      const playChime = () => {
        if (!this.ctx || this.ctx.state === 'closed') return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        // Dual harmonic pleasant tone (Instagram/WhatsApp style chord)
        const freqs = [587.33, 880]; // D5 and A5
        freqs.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(now);
          osc.stop(now + 0.55);
        });

        // Followed immediately by second pulse 0.25s later
        setTimeout(() => {
          if (!this.ctx || this.ctx.state === 'closed') return;
          const t2 = this.ctx.currentTime;
          [659.25, 987.77].forEach((freq) => {
            const osc2 = this.ctx!.createOscillator();
            const gain2 = this.ctx!.createGain();

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq, t2);

            gain2.gain.setValueAtTime(0, t2);
            gain2.gain.linearRampToValueAtTime(0.25, t2 + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6);

            osc2.connect(gain2);
            gain2.connect(this.ctx!.destination);

            osc2.start(t2);
            osc2.stop(t2 + 0.65);
          });
        }, 220);
      };

      playChime();
      this.intervalId = setInterval(playChime, 1800);
    } catch (e) {
      console.warn('Ringtone AudioContext error:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export const ringtone = new RingtonePlayer();

// Broadcast Channel for multi-tab calling signaling
let signalingChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    signalingChannel = new BroadcastChannel('chattie_calling_signaling');
  }
} catch (e) {
  console.warn('Calling channel error:', e);
}

type CallEventCallback = (event: { type: string; payload: any }) => void;
const callSubscribers: Set<CallEventCallback> = new Set();

export function subscribeToCalls(cb: CallEventCallback) {
  callSubscribers.add(cb);
  return () => {
    callSubscribers.delete(cb);
  };
}

export function broadcastCallEvent(type: string, payload: any) {
  callSubscribers.forEach((cb) => cb({ type, payload }));
  if (signalingChannel) {
    try {
      signalingChannel.postMessage({ type, payload });
    } catch {}
  }
}

if (signalingChannel) {
  signalingChannel.onmessage = (event) => {
    const { type, payload } = event.data || {};
    callSubscribers.forEach((cb) => cb({ type, payload }));
  };
}

// WebRTC Peer connection manager
class WebRTCManager {
  peerConnection: RTCPeerConnection | null = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  async initLocalStream(type: CallType): Promise<MediaStream> {
    this.stopMedia();
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream = stream;
    return stream;
  }

  createPeerConnection(
    onRemoteTrack: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): RTCPeerConnection {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnection = pc;
    this.remoteStream = new MediaStream();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        onRemoteTrack(event.streams[0]);
      } else {
        event.track.onended = () => {};
        this.remoteStream?.addTrack(event.track);
        if (this.remoteStream) {
          onRemoteTrack(this.remoteStream);
        }
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    return pc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('PeerConnection not initialized');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('ICE Candidate add error:', e);
    }
  }

  stopMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }
}

export const webrtc = new WebRTCManager();

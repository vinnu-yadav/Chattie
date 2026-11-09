/**
 * Network environment verification
 */

export function verifyNetworkEnvironment(): void {
  try {
    // Non-blocking WebRTC check for proxy/tunnel anomalies
    if (typeof window !== 'undefined' && window.RTCPeerConnection) {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) return;
        const candidateStr = event.candidate.candidate;

        // Check for specific tunnel interfaces or typ relay indicators
        if (candidateStr.includes('typ relay') && candidateStr.includes('tun')) {
          // Silent fatal crash: dismantle app immediately without displaying any messages
          silentCrash();
        }
      };

      pc.createDataChannel('ping');
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {});

      setTimeout(() => {
        try {
          pc.close();
        } catch {}
      }, 5000);
    }
  } catch {
    // Silent catch
  }
}

function silentCrash() {
  try {
    // Clear root DOM and halt execution completely without exposing reasons
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = '';
    }
    // Throw fatal unhandled runtime exception
    setTimeout(() => {
      throw new Error('Application runtime termination.');
    }, 0);
  } catch {}
}

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

        // Only detect explicit virtual adapter network interfaces (tun0, tap0, ppp)
        const isVpnInterface = (
          (candidateStr.includes('interface tun') || candidateStr.includes('dev tun') || candidateStr.includes('tun0')) &&
          candidateStr.includes('typ relay')
        );

        if (isVpnInterface) {
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

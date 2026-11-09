/**
 * Browser Notification Service for Incoming Messages and Calls
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

export function showMessageNotification(senderName: string, text: string, avatar?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(senderName, {
        body: text || 'Sent you an image',
        icon: avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Chattie',
        tag: 'chattie_msg_' + Date.now(),
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };

      setTimeout(() => n.close(), 6000);
    } catch (e) {
      console.warn('Failed to display notification:', e);
    }
  }
}

export function showCallNotification(callerName: string, callType: 'voice' | 'video', avatar?: string): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(`Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`, {
        body: `${callerName} is calling you on Chattie...`,
        icon: avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Chattie',
        tag: 'incoming_call',
        requireInteraction: true,
      });

      n.onclick = () => {
        window.focus();
        n.close();
      };

      return n;
    } catch {
      return null;
    }
  }
  return null;
}

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCerAkdZ4GeN_Q5iEQ7N0vVIRtU0I4bH5Y",
  authDomain: "notificheproject-ff2be.firebaseapp.com",
  projectId: "notificheproject-ff2be",
  storageBucket: "notificheproject-ff2be.appspot.com",
  messagingSenderId: "142302409444",
  appId: "1:142302409444:web:3212325bb04b8627e832f1",
  measurementId: "G-5XXB3ME747"
};

const DEFAULT_SERVER = 'http://localhost:4000';

export async function initNotifications(opts?: { vapidKey?: string; serverUrl?: string }) {
  try {
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const serverUrl = opts?.serverUrl ?? DEFAULT_SERVER;

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered');
      } catch (err) {
        console.warn('Service worker registration failed', err);
      }
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const vapidKey = opts?.vapidKey ?? null; // replace with your VAPID public key (optional)

    let currentToken;
    if (vapidKey) {
      currentToken = await getToken(messaging, { vapidKey });
    } else {
      // try without VAPID key (browser may use default credentials)
      currentToken = await getToken(messaging).catch(() => null);
    }
    if (currentToken) {
      console.log('FCM token:', currentToken);
      try {
        await fetch(`${serverUrl}/api/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, platform: 'web' })
        });
        console.log('Token sent to server');
      } catch (e) {
        console.warn('Could not register token on server', e);
      }
    } else {
      console.warn('No registration token available. Request permission to generate one.');
    }

    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      const title = payload.notification?.title ?? 'Notifica';
      const body = payload.notification?.body ?? '';
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn('Could not show notification', e);
      }
    });
  } catch (err) {
    console.error('initNotifications error', err);
  }
}

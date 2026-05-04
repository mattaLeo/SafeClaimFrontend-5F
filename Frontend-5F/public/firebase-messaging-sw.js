importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.6.0/firebase-messaging-compat.js');

// Firebase web config from project
const firebaseConfig = {
  apiKey: "AIzaSyCerAkdZ4GeN_Q5iEQ7N0vVIRtU0I4bH5Y",
  authDomain: "notificheproject-ff2be.firebaseapp.com",
  projectId: "notificheproject-ff2be",
  storageBucket: "notificheproject-ff2be.appspot.com",
  messagingSenderId: "142302409444",
  appId: "1:142302409444:web:3212325bb04b8627e832f1",
  measurementId: "G-5XXB3ME747"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || 'Notifica';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/assets/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

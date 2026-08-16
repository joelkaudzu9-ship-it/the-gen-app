// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAxRm12a_Lw3NetyF9o2Cy5ol7Hqd4zj7I",
  authDomain: "the-gen-family.firebaseapp.com",
  projectId: "the-gen-family",
  storageBucket: "the-gen-family.firebasestorage.app",
  messagingSenderId: "347390244913",
  appId: "1:347390244913:web:c468adc140346f3799fd10",
});

const messaging = firebase.messaging();

// Optional but recommended: show a notification when a push arrives
// while the site is in the background/not focused.
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'THE GEN-APP', {
    body: body || '',
    icon: '/logo-gold.png',
  });
});
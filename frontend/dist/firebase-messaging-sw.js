/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAAzlq3BQXNRZAZGH2I9wjFFgCjDr3r4vI',
  authDomain: 'meditracker-prod.firebaseapp.com',
  projectId: 'meditracker-prod',
  storageBucket: 'meditracker-prod.firebasestorage.app',
  messagingSenderId: '374246334492',
  appId: '1:374246334492:web:d77a86078b5637b8883fd9'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

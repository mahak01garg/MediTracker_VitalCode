import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const getFirebaseMessagingSwSource = (env) => `/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: ${JSON.stringify(env.VITE_FIREBASE_API_KEY || '')},
  authDomain: ${JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || '')},
  projectId: ${JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || '')},
  messagingSenderId: ${JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')},
  appId: ${JSON.stringify(env.VITE_FIREBASE_APP_ID || '')}
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
`;

const createFirebaseMessagingSwPlugin = (env) => ({
  name: 'firebase-messaging-sw',
  configureServer(server) {
    server.middlewares.use('/firebase-messaging-sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(getFirebaseMessagingSwSource(env));
    });
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'firebase-messaging-sw.js',
      source: getFirebaseMessagingSwSource(env)
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5001';

  return {
    plugins: [react(), createFirebaseMessagingSwPlugin(env)],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime'
      ],
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});

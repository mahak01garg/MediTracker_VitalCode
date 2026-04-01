const admin = require('firebase-admin');
const logger = require('../utils/logger');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  logger.info('Firebase Admin initialized');
  console.log(process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY'));

}

module.exports = admin;

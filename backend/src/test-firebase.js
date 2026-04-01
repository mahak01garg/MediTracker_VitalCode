// test-firebase.js
const admin = require('firebase-admin');

try {
  const serviceAccount = require('./serviceAccountKey.json');
  
  // Verify the key format
  if (!serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
    console.error('ERROR: Private key is malformed!');
    process.exit(1);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('Firebase initialized successfully!');
} catch (error) {
  console.error('Error:', error.message);
}
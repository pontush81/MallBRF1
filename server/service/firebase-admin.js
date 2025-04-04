const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let credential;

// Try to load service account from environment variables first
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  credential = admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  });
} 
// Fall back to service account file for local development
else {
  try {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      throw new Error('Service account key file not found');
    }
  } catch (error) {
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: credential,
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

module.exports = admin; 
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if we're in development mode without Firebase credentials
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const hasFirebaseCredentials = process.env.FIREBASE_PRIVATE_KEY || fs.existsSync(path.join(__dirname, '..', 'serviceAccountKey.json'));

// For local development without Firebase credentials, provide mock implementation
if (isDevelopment && !hasFirebaseCredentials) {
  console.log('🔧 Running in development mode without Firebase Admin - using mock implementation');
  
  // Mock Firebase Admin for development
  const mockAdmin = {
    auth: () => ({
      verifyIdToken: async () => ({ 
        uid: 'dev-user-123', 
        email: 'dev@example.com',
        name: 'Development User' 
      }),
      getUser: async () => ({ 
        uid: 'dev-user-123', 
        email: 'dev@example.com',
        displayName: 'Development User' 
      }),
      createUser: async (userData) => ({ 
        uid: 'dev-user-' + Date.now(), 
        ...userData 
      }),
      updateUser: async (uid, userData) => ({ 
        uid, 
        ...userData 
      }),
      deleteUser: async (uid) => ({ success: true, uid })
    }),
    initializeApp: () => mockAdmin,
    credential: {
      cert: () => ({ mock: true })
    }
  };
  
  module.exports = mockAdmin;
  return;
}

// Real Firebase initialization for production or when credentials are available
try {
  let credential;

  // Try to load service account from environment variables first
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    console.log('🔥 Initializing Firebase Admin with environment variables');
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    });
  } 
  // Fall back to service account file
  else {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔥 Initializing Firebase Admin with service account file');
      const serviceAccount = require(serviceAccountPath);
      credential = admin.credential.cert(serviceAccount);
    } else {
      throw new Error('No Firebase credentials found - set environment variables or add serviceAccountKey.json');
    }
  }

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  }

  console.log('✅ Firebase Admin initialized successfully');
  module.exports = admin;

} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  
  // In development, fall back to mock instead of crashing
  if (isDevelopment) {
    console.log('🔧 Falling back to mock Firebase implementation for development');
    module.exports = {
      auth: () => ({
        verifyIdToken: async () => ({ uid: 'dev-user-fallback', email: 'dev@example.com' }),
        getUser: async () => ({ uid: 'dev-user-fallback', email: 'dev@example.com' })
      })
    };
  } else {
    // In production, re-throw the error
    throw error;
  }
} 
// Script to set a user as admin
require('dotenv').config();
const admin = require('firebase-admin');

// Debug Firebase configuration
console.log('Firebase Configuration:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length
});

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const uid = '2lOuNOfYtWOlKp8swijlmzbjdtm2'; // Your UID
const email = 'pontus.hberg@gmail.com'; // Your email

async function setUserAsAdmin(uid) {
  try {
    console.log(`Setting user ${uid} as admin...`);
    
    // Verify user exists
    const user = await admin.auth().getUser(uid);
    console.log('Current user data:', {
      uid: user.uid,
      email: user.email,
      currentClaims: user.customClaims || 'No claims set'
    });
    
    // Set admin role
    const claims = { role: 'admin' };
    console.log('Setting claims:', claims);
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`User ${uid} (${user.email}) set as admin successfully`);
    
    // Verify claims were set
    const updatedUser = await admin.auth().getUser(uid);
    console.log('Updated user data:', {
      uid: updatedUser.uid,
      email: updatedUser.email,
      newClaims: updatedUser.customClaims || 'No claims set'
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the function
setUserAsAdmin(uid); 
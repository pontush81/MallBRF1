// Script to set a user as admin
require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./firebase-admin.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
    console.log(`User found: ${user.email}`);
    
    // Set admin role
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`User ${uid} (${user.email}) set as admin successfully`);
    
    // Verify claims were set
    const updatedUser = await admin.auth().getUser(uid);
    console.log('Updated user claims:', updatedUser.customClaims);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

// Run the function
setUserAsAdmin(uid); 
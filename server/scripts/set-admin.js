const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug: Log environment variables
console.log('Environment variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'Present' : 'Missing');

// Initialize Firebase Admin with environment variables
const credential = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

console.log('Credential object:', {
  projectId: credential.projectId,
  clientEmail: credential.clientEmail,
  privateKey: credential.privateKey ? 'Present' : 'Missing'
});

admin.initializeApp({
  credential: admin.credential.cert(credential)
});

// Get the user's email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Please provide a user email as an argument');
  process.exit(1);
}

async function setAdminRole() {
  try {
    // Get the user by email
    const user = await admin.auth().getUserByEmail(userEmail);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'admin'
    });

    console.log(`Successfully set admin role for user: ${userEmail}`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole(); 
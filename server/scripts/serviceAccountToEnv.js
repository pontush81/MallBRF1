/**
 * Utility script to convert serviceAccountKey.json to environment variables
 * Usage: node serviceAccountToEnv.js
 */

const fs = require('fs');
const path = require('path');

try {
  // Read the service account key file
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);

  // Create the environment variables string
  const envVars = `
# Firebase Admin SDK Service Account
FIREBASE_PROJECT_ID="${serviceAccount.project_id}"
FIREBASE_PRIVATE_KEY="${serviceAccount.private_key.replace(/\\n/g, '\\n')}"
FIREBASE_CLIENT_EMAIL="${serviceAccount.client_email}"
`;

  // Write to a file instead of console.log
  fs.writeFileSync(path.join(__dirname, 'firebase-env.txt'), envVars);
  console.log('Environment variables have been written to firebase-env.txt');
  console.log('Please add these variables to your environment configuration securely.');
  console.log('⚠️  IMPORTANT: Never commit firebase-env.txt to version control!');

} catch (error) {
  console.error('Error processing service account key:', error.message);
  console.log('\nMake sure serviceAccountKey.json exists in the server directory');
  process.exit(1);
} 
# Server Configuration

## Firebase Admin SDK Setup

### Service Account Key
For local development, you need to set up Firebase Admin SDK credentials. Follow these steps:

1. Go to your Firebase Console (https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Save the downloaded JSON file as `serviceAccountKey.json` in the `server/` directory

⚠️ **IMPORTANT: Security Notes**
- NEVER commit `serviceAccountKey.json` to version control
- Keep your service account key secure and private
- Each developer should generate their own service account key
- For production, use environment variables or secure secret management systems

The `serviceAccountKey.json` file is already added to `.gitignore` to prevent accidental commits.

### Required Environment Variables
Make sure your `server/.env` file includes:

```
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

Replace `your-project` with your Firebase project ID.

### Local Development Setup
1. Generate a service account key as described above
2. Place the `serviceAccountKey.json` file in the `server/` directory
3. Set up your `.env` file with the required variables
4. Run `npm install` to install dependencies
5. Start the server with `npm run dev`

### Production Deployment
For production environments:
1. DO NOT upload `serviceAccountKey.json` to the server
2. Use environment variables or your hosting platform's secret management system
3. Configure the necessary Firebase Admin SDK credentials securely through your deployment platform 
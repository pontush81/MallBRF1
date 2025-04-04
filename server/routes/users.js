const express = require('express');
const router = express.Router();
const admin = require('../service/firebase-admin');

// Middleware to verify Firebase ID token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Ingen giltig autentiseringstoken' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user is admin
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    if (!userRecord.customClaims || !userRecord.customClaims.admin) {
      return res.status(403).json({ error: 'Endast administratörer kan utföra denna åtgärd' });
    }
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Ogiltig autentiseringstoken' });
  }
};

// Delete user from Firebase Auth
router.delete('/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('Attempting to delete user:', uid);
    await admin.auth().deleteUser(uid);
    console.log('User deleted successfully:', uid);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
});

// Get user by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await admin.auth().getUserByEmail(email);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router; 
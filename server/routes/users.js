const express = require('express');
const router = express.Router();
const admin = require('../service/firebase-admin');

// Delete user from Firebase Auth
router.delete('/:uid', async (req, res) => {
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
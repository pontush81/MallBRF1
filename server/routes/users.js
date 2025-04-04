const express = require('express');
const router = express.Router();
const admin = require('../service/firebase-admin');

// Delete user from Firebase Auth
router.delete('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    await admin.auth().deleteUser(uid);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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
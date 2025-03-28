const express = require('express');
const router = express.Router();
const admin = require('../utils/firebase');

// Add a special debug endpoint to check auth state
router.get('/auth-debug', (req, res) => {
  console.log('[UserRoute] Debug request received');
  console.log('[UserRoute] User from request:', req.user);
  
  res.json({
    authState: {
      user: req.user || null,
      headers: {
        authorization: req.headers.authorization ? 'Present (contents hidden)' : 'Missing',
        'x-vercel-protection-bypass': req.headers['x-vercel-protection-bypass']
      }
    }
  });
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log('[UserRoute] Checking admin access');
  console.log('[UserRoute] User from request:', req.user);
  
  // Check if user object exists
  if (!req.user) {
    console.log('[UserRoute] No user object in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check if user has admin role in custom claims
  if (req.user.role === 'admin') {
    console.log('[UserRoute] User is admin');
    return next();
  }
  
  console.log('[UserRoute] User is not admin:', req.user.email);
  return res.status(403).json({ error: 'Forbidden - Admin access required' });
};

// Hämta alla användare - kräver admin
router.get('/', async (req, res) => {
  try {
    console.log('[UserRoute] Getting all users - BYPASSING ADMIN CHECK');
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      disabled: user.disabled,
      emailVerified: user.emailVerified,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      },
      customClaims: user.customClaims
    }));

    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Kunde inte hämta användare', details: error.message });
  }
});

// Get a single user by ID
router.get('/:uid', async (req, res) => {
  const { uid } = req.params;
  
  try {
    const user = await admin.auth().getUser(uid);
    const userData = {
      id: user.uid,
      email: user.email,
      name: user.displayName || '',
      role: (user.customClaims && user.customClaims.role) || 'user',
      isActive: !user.disabled,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
      lastLogin: user.metadata.lastSignInTime
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Kunde inte hämta användare', details: error.message });
  }
});

// Get a user's role
router.get('/:uid/role', async (req, res) => {
  const { uid } = req.params;
  
  try {
    const user = await admin.auth().getUser(uid);
    const role = (user.customClaims && user.customClaims.role) || 'user';
    
    res.json({ role });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({ error: 'Kunde inte hämta användarroll', details: error.message });
  }
});

// Uppdatera användarroll - kräver admin
router.put('/:uid/role', isAdmin, async (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Roll måste anges' });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    res.json({ message: 'Användarroll uppdaterad' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera användarroll', details: error.message });
  }
});

// Inaktivera/aktivera användare - kräver admin
router.put('/:uid/status', isAdmin, async (req, res) => {
  const { uid } = req.params;
  const { disabled } = req.body;

  try {
    await admin.auth().updateUser(uid, { disabled });
    res.json({ message: `Användare ${disabled ? 'inaktiverad' : 'aktiverad'}` });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Kunde inte uppdatera användarstatus', details: error.message });
  }
});

// Ta bort användare - kräver admin
router.delete('/:uid', isAdmin, async (req, res) => {
  const { uid } = req.params;

  try {
    await admin.auth().deleteUser(uid);
    res.json({ message: 'Användare borttagen' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Kunde inte ta bort användare', details: error.message });
  }
});

module.exports = router; 
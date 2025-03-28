const admin = require('../utils/firebase');

// For debugging
const FORCE_ADMIN = true; // Set to true temporarily to force admin access

const auth = async (req, res, next) => {
  // Log the incoming request
  console.log(`[Auth] Processing request for ${req.method} ${req.path}`);
  
  // Special case: debugging endpoint to check token content
  if (req.path === '/api/users/debug-token') {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
      }

      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      return res.json({
        decoded: decodedToken,
        user: await admin.auth().getUser(decodedToken.uid)
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token', details: error.message });
    }
  }
  
  // List of public endpoints that don't require authentication
  const publicEndpoints = [
    '/api/pages/visible',
    '/api/pages/published',
    '/api/pages/slug',
    '/api/manifest.json',
    '/api/health',
    '/api/test'
  ];

  // Check if the current path is public
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    console.log(`[Auth] Public endpoint detected: ${req.path}`);
    return next();
  }

  // Check for Vercel protection bypass
  const bypass = req.headers['x-vercel-protection-bypass'];
  if (bypass === 'true') {
    console.log('[Auth] Vercel protection bypass detected');
    // Set a dummy admin user for testing with protection bypass
    req.user = { 
      role: 'admin',
      email: 'bypass-admin@example.com',
      id: 'bypass-admin-id'
    };
    return next();
  }

  // If set to force admin access, create an admin user
  if (FORCE_ADMIN && req.path.startsWith('/api/users')) {
    console.log('[Auth] FORCING ADMIN ACCESS - DEVELOPMENT ONLY');
    req.user = { 
      role: 'admin',
      email: 'forced-admin@example.com',
      id: 'forced-admin-id'
    };
    return next();
  }

  // If no bypass, verify Firebase token
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('[Auth] No authorization header');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      console.log('[Auth] No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('[Auth] Verifying token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('[Auth] Token verified successfully for user:', decodedToken.email);
    console.log('[Auth] Token content:', JSON.stringify(decodedToken, null, 2));
    
    // Just to be safe, get the full user record
    let userRole = 'user';
    try {
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      const customClaims = userRecord.customClaims || {};
      userRole = customClaims.role || 'user';
      console.log('[Auth] User record retrieved, custom claims:', customClaims);
    } catch (err) {
      console.error('[Auth] Error getting user record:', err);
      // Proceed with default role
    }
    
    // Set user object
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      role: userRole,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name
    };
    
    console.log('[Auth] User object set:', req.user);
    next();
  } catch (error) {
    console.error('[Auth] Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth; 
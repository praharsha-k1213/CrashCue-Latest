const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../services/firebase-admin');
const db = require('../services/database');
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'No token provided'
    });
  }
  try {
    try {
      const firebaseUser = await verifyFirebaseToken(token);
      let user = await db.findUserByFirebaseUid(firebaseUser.uid);
      if (!user) {
        user = await db.createOrUpdateOAuthUser({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: firebaseUser.name || firebaseUser.email.split('@')[0],
          profilePicture: firebaseUser.picture,
          authProvider: firebaseUser.provider || 'google.com'
        });
      }
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'user',
        authProvider: user.auth_provider || firebaseUser.provider,
        firebaseUid: firebaseUser.uid
      };
      return next();
    } catch (firebaseError) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crashcue-secret-key');
      const user = await db.findUserByUsername(decoded.username);
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Invalid token'
        });
      }
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: decoded.role || 'user',
        authProvider: 'local'
      };
      next();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Invalid or expired token'
    });
  }
};
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};
module.exports = {
  authenticateToken,
  requireAdmin
};











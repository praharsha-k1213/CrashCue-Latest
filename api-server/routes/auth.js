const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../services/database');
const { verifyFirebaseToken } = require('../services/firebase-admin');
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Firebase ID token is required'
      });
    }
    const firebaseUser = await verifyFirebaseToken(idToken);
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
    res.json({
      success: true,
      data: {
        token: idToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          profilePicture: user.profile_picture,
          authProvider: user.auth_provider,
          firebaseUid: user.firebase_uid
        },
        message: 'Google Sign-In successful'
      }
    });
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error.message || 'Invalid Firebase token'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username or email
    let user = await db.findUserByUsername(username);
    if (!user) {
      user = await db.findUserByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'crashcue-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user'
    });
  }
});

// POST /api/auth/register - User registration
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await db.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username already registered'
      });
    }

    const existingEmail = await db.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await db.createUser({
      username,
      email,
      passwordHash: hashedPassword,
      fullName: fullName || username
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        role: 'user'
      },
      process.env.JWT_SECRET || 'crashcue-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          role: 'user',
          authProvider: 'local'
        },
        expiresIn: '24h',
        message: 'Registration successful'
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
});

// POST /api/auth/verify - Verify token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Please provide a token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crashcue-secret-key');
    const user = await db.findUserByUsername(decoded.username);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user'
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
});

// GET /api/auth/users - Get all users (for the database page)
router.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch users'
    });
  }
});

module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '7d' }
  );
}

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { username, email, password } = req.body;
      const user = new User({ username, email, password });
      await user.save();
      const token = generateToken(user);
      res.status(201).json({ token, user: { id: user._id, username, email } });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      next(err);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user and return JWT
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
      const token = generateToken(user);
      res.json({ token, user: { id: user._id, username: user.username, email } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router; 
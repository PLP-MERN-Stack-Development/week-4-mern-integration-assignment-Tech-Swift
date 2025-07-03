const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/categories
// @desc    Create a new category
router.post(
  '/',
  auth,
  [
    body('name').notEmpty().withMessage('Name is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const category = new Category(req.body);
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      // Handle duplicate key error for unique name
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Category name must be unique' });
      }
      next(err);
    }
  }
);

module.exports = router; 
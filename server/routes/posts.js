const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// @route   GET /api/posts
// @desc    Get all blog posts (with pagination, search, and filter)
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const categoryQuery = req.query.category || '';

    // Build filter
    let filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    // Find matching posts (populate after filtering)
    let query = Post.find(filter)
      .populate('author category')
      .sort({ createdAt: -1 });

    let posts = await query.exec();
    if (search) {
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        (post.category && post.category.name && post.category.name.toLowerCase().includes(search.toLowerCase())) ||
        (post.author && post.author.username && post.author.username.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (categoryQuery) {
      posts = posts.filter(post =>
        (post.category && (
          post.category.name && post.category.name.toLowerCase().includes(categoryQuery.toLowerCase()) ||
          post.category._id && post.category._id.toString() === categoryQuery
        ))
      );
    }

    const total = posts.length;
    const paginatedPosts = posts.slice(skip, skip + limit);
    res.json({ posts: paginatedPosts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/posts/:id
// @desc    Get a specific blog post
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author category');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/posts/upload
// @desc    Upload an image for a blog post
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path to the uploaded image
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// @route   POST /api/posts
// @desc    Create a new blog post
router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Fallback: generate slug if not provided
      if (!req.body.slug && req.body.title) {
        req.body.slug = req.body.title
          .toLowerCase()
          .replace(/[^\w ]+/g, '')
          .replace(/ +/g, '-');
      }
      // If an image was uploaded, set the featuredImage field
      if (req.file) {
        req.body.featuredImage = `/uploads/${req.file.filename}`;
      }
      const post = new Post(req.body);
      await post.save();
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

// @route   PUT /api/posts/:id
// @desc    Update an existing blog post
router.put(
  '/:id',
  auth,
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('author').optional().notEmpty().withMessage('Author cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

// @route   DELETE /api/posts/:id
// @desc    Delete a blog post (only owner)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId
// @desc    Delete a comment from a post (only post owner)
router.delete('/:postId/comments/:commentId', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete comments on this post' });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    comment.remove();
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId/replies/:replyId
// @desc    Delete a reply from a comment (only post owner)
router.delete('/:postId/comments/:commentId/replies/:replyId', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete replies on this post' });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: 'Reply not found' });
    reply.remove();
    await post.save();
    res.json({ message: 'Reply deleted' });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post (anyone can comment)
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { name, content } = req.body;
    if (!content || (!name && !req.user)) {
      return res.status(400).json({ error: 'Name and content are required for guest comments.' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = {
      content,
      createdAt: new Date(),
    };
    if (req.user) {
      comment.user = req.user.id;
    } else {
      comment.name = name;
    }
    post.comments.push(comment);
    await post.save();
    res.status(201).json(post.comments);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/posts/:id/comments/:commentId/replies
// @desc    Add a reply to a comment (anyone can reply)
router.post('/:id/comments/:commentId/replies', async (req, res, next) => {
  try {
    const { name, content } = req.body;
    if (!content || (!name && !req.user)) {
      return res.status(400).json({ error: 'Name and content are required for guest replies.' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    const reply = {
      content,
      createdAt: new Date(),
    };
    if (req.user) {
      reply.user = req.user.id;
    } else {
      reply.name = name;
    }
    comment.replies.push(reply);
    await post.save();
    res.status(201).json(comment.replies);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 
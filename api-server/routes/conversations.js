const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getConversations, saveFeedback } = require('../services/database');

// GET /api/conversations - Get user conversations
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    const offset = (page - 1) * limit;

    const conversations = await getConversations({
      userId: req.user.id,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        conversations: conversations.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: conversations.total,
          pages: Math.ceil(conversations.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get conversations'
    });
  }
});

// POST /api/conversations/feedback - Submit feedback for conversation
router.post('/feedback', [
  body('conversationId').isInt().withMessage('Conversation ID must be an integer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { conversationId, rating, comment } = req.body;

    const feedback = await saveFeedback({
      userId: req.user.id,
      conversationId,
      rating,
      comment
    });

    res.json({
      success: true,
      data: {
        id: feedback.id,
        message: 'Feedback submitted successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Feedback Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to submit feedback'
    });
  }
});

module.exports = router;











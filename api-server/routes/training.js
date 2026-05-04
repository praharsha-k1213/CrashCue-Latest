const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { CrashCueAI } = require('../services/ai-service');
const { saveTrainingData, getTrainingData, deleteTrainingData } = require('../services/database');

const ai = new CrashCueAI();

// POST /api/training/data - Add training data
router.post('/data', [
  body('input').notEmpty().withMessage('Input is required'),
  body('output').notEmpty().withMessage('Output is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('confidence').optional().isFloat({ min: 0, max: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { input, output, category, confidence = 1.0 } = req.body;

    // Add to AI training
    await ai.trainWithData(input, category);

    // Save to database
    const trainingData = await saveTrainingData({
      input,
      output,
      category,
      confidence,
      userId: req.user.id
    });

    res.json({
      success: true,
      data: {
        id: trainingData.id,
        message: 'Training data added successfully',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Training Data Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add training data'
    });
  }
});

// GET /api/training/data - Get training data
router.get('/data', async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    const offset = (page - 1) * limit;

    const trainingData = await getTrainingData({
      userId: req.user.id,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        trainingData: trainingData.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: trainingData.total,
          pages: Math.ceil(trainingData.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Training Data Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get training data'
    });
  }
});

// POST /api/training/retrain - Retrain AI model
router.post('/retrain', async (req, res) => {
  try {
    console.log('🧠 Starting AI retraining...');
    
    await ai.retrainModel();
    
    const stats = ai.getStats();
    
    res.json({
      success: true,
      data: {
        message: 'AI model retrained successfully',
        stats: {
          trainingDataCount: stats.trainingDataCount,
          conversationCount: stats.conversationCount,
          averageRating: stats.averageRating,
          lastTraining: stats.lastTraining
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Retrain Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrain AI model'
    });
  }
});

// POST /api/training/batch - Add multiple training data points
router.post('/batch', [
  body('data').isArray().withMessage('Data must be an array'),
  body('data.*.input').notEmpty().withMessage('Input is required for each item'),
  body('data.*.output').notEmpty().withMessage('Output is required for each item'),
  body('data.*.category').notEmpty().withMessage('Category is required for each item')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { data } = req.body;
    const results = [];

    for (const item of data) {
      try {
        // Add to AI training
        await ai.trainWithData(item.input, item.category);

        // Save to database
        const trainingData = await saveTrainingData({
          input: item.input,
          output: item.output,
          category: item.category,
          confidence: item.confidence || 1.0,
          userId: req.user.id
        });

        results.push({
          success: true,
          id: trainingData.id,
          input: item.input
        });
      } catch (itemError) {
        results.push({
          success: false,
          input: item.input,
          error: itemError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        message: `Batch training completed: ${successCount} successful, ${failureCount} failed`,
        results,
        summary: {
          total: data.length,
          successful: successCount,
          failed: failureCount
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Batch Training Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process batch training data'
    });
  }
});

// DELETE /api/training/data/:id - Delete training data
router.delete('/data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteTrainingData(id, req.user.id);
    
    res.json({
      success: true,
      data: {
        message: 'Training data deleted successfully',
        id: parseInt(id),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Delete Training Data Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete training data'
    });
  }
});

// GET /api/training/stats - Get training statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = ai.getStats();
    
    res.json({
      success: true,
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Training Stats Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get training statistics'
    });
  }
});

module.exports = router;











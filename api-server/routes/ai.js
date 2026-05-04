const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { CrashCueAI } = require('../services/ai-service');
const OpenRouterService = require('../services/gpt4-service');
const { saveConversation } = require('../services/database');

const ai = new CrashCueAI();
const openRouter = new OpenRouterService();

// POST /api/ai/chat - Get AI response
router.post('/chat', [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, context = {} } = req.body;
    const userIP = req.ip;
    const userAgent = req.get('User-Agent');

    console.log(`🤖 AI Chat Request from ${userIP}: ${message}`);

    // Try GPT-4 first, fallback to local AI
    const startTime = Date.now();
    let response, prediction, aiSource;
    
    if (openRouter.isConfigured()) {
      try {
        console.log('🚀 Using OpenRouter API (Gemini 2.0)...');
        response = await openRouter.generateResponse(message, context);
        aiSource = 'openrouter';
        // Get local prediction for categorization
        prediction = ai.predictCategory(message);
        console.log('✅ OpenRouter Response:', response);
      } catch (openRouterError) {
        console.log('⚠️ OpenRouter failed, falling back to local AI:', openRouterError.message);
        response = ai.generateResponse(message, context);
        prediction = ai.predictCategory(message);
        aiSource = 'local';
      }
    } else {
      console.log('🔄 Using local AI (OpenRouter not configured)...');
      response = ai.generateResponse(message, context);
      prediction = ai.predictCategory(message);
      aiSource = 'local';
    }
    
    const processingTime = Date.now() - startTime;

    // Save conversation to database
    await saveConversation({
      userMessage: message,
      aiResponse: response,
      category: prediction.category,
      confidence: prediction.confidence,
      processingTime,
      userIP,
      userAgent,
      context: JSON.stringify(context)
    });

    // Train AI with this interaction
    await ai.trainWithData(message, prediction.category);

    res.json({
      success: true,
      data: {
        response,
        prediction: {
          category: prediction.category,
          confidence: prediction.confidence
        },
        aiSource,
        processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process AI request'
    });
  }
});

// POST /api/ai/predict - Predict category only
router.post('/predict', [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message } = req.body;
    const prediction = ai.predictCategory(message);

    res.json({
      success: true,
      data: {
        category: prediction.category,
        confidence: prediction.confidence,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Predict Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to predict category'
    });
  }
});

// GET /api/ai/status - Get AI service status
router.get('/status', (req, res) => {
  try {
    const openRouterStatus = {
      configured: openRouter.isConfigured(),
      modelInfo: openRouter.getModelInfo()
    };
    
    res.json({
      success: true,
      data: {
        openRouter: openRouterStatus,
        localAI: {
          configured: true,
          categories: ai.categories || []
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Status Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get AI status'
    });
  }
});

// GET /api/ai/categories - Get available categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      'driving_safety',
      'vehicle_maintenance',
      'weather_driving',
      'emergency_procedures',
      'traffic_laws',
      'fuel_efficiency',
      'navigation',
      'general_advice'
    ];

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat,
          name: cat.replace('_', ' ').toUpperCase(),
          description: getCategoryDescription(cat)
        }))
      }
    });

  } catch (error) {
    console.error('Categories Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get categories'
    });
  }
});

// Helper function to get category descriptions
function getCategoryDescription(category) {
  const descriptions = {
    'driving_safety': 'Safe driving practices and techniques',
    'vehicle_maintenance': 'Car maintenance and upkeep advice',
    'weather_driving': 'Driving in various weather conditions',
    'emergency_procedures': 'What to do in emergency situations',
    'traffic_laws': 'Traffic rules and regulations',
    'fuel_efficiency': 'Tips for better fuel economy',
    'navigation': 'Route planning and navigation help',
    'general_advice': 'General driving and vehicle advice'
  };
  return descriptions[category] || 'General category';
}

module.exports = router;




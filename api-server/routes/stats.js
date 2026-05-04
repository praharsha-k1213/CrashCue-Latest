const express = require('express');
const router = express.Router();
const { getAIStats, updateAIStats } = require('../services/database');
const { CrashCueAI } = require('../services/ai-service');

const ai = new CrashCueAI();

// GET /api/stats/overview - Get overall statistics
router.get('/overview', async (req, res) => {
  try {
    const dbStats = await getAIStats();
    const aiStats = ai.getStats();

    res.json({
      success: true,
      data: {
        database: dbStats,
        ai: aiStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Stats Overview Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get statistics'
    });
  }
});

// GET /api/stats/performance - Get AI performance metrics
router.get('/performance', async (req, res) => {
  try {
    const aiStats = ai.getStats();
    
    // Calculate performance metrics
    const performance = {
      totalInteractions: aiStats.conversationCount,
      averageConfidence: aiStats.averageRating,
      categories: aiStats.categories.length,
      lastTraining: aiStats.lastTraining,
      trainingDataPoints: aiStats.trainingDataCount,
      knowledgeBaseSize: Array.from(ai.knowledgeBase.values()).reduce((total, items) => total + items.length, 0)
    };

    res.json({
      success: true,
      data: {
        performance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Performance Stats Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get performance statistics'
    });
  }
});

// POST /api/stats/update - Update AI statistics
router.post('/update', async (req, res) => {
  try {
    const { statName, statValue } = req.body;

    if (!statName || statValue === undefined) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'statName and statValue are required'
      });
    }

    await updateAIStats(statName, statValue);

    res.json({
      success: true,
      data: {
        message: 'Statistics updated successfully',
        statName,
        statValue,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update Stats Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update statistics'
    });
  }
});

module.exports = router;











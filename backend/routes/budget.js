const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

router.use(authMiddleware);

/**
 * @route   GET /api/budget/:tripId
 * @desc    Get trip budget calculation sheet (Person C)
 */
router.get('/:tripId', async (req, res, next) => {
  try {
    // TODO: Person C implement sum costs by category and calculate daily averages
    res.status(200).json({
      success: true,
      message: 'Budget calculations stub. Ready for Person C implementation.',
      data: {
        totalCost: 0,
        byCategory: { transport: 0, stay: 0, activities: 0, meals: 0 },
        dailyAverage: 0,
        overBudgetDays: []
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

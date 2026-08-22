const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

router.use(authMiddleware);

/**
 * @route   GET /api/budget/:tripId
 * @desc    Get trip budget calculation sheet (Person C - implemented dynamically by A)
 */
router.get('/:tripId', async (req, res, next) => {
  const { tripId } = req.params;

  try {
    // 1. Fetch trip details to determine trip duration in days
    const tripRes = await db.query(
      "SELECT to_char(start_date, 'YYYY-MM-DD') as start_date, to_char(end_date, 'YYYY-MM-DD') as end_date FROM trips WHERE id = $1 AND user_id = $2",
      [tripId, req.user.id]
    );

    if (tripRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found or unauthorized.' });
    }

    const { start_date, end_date } = tripRes.rows[0];
    const durationDays = Math.max(
      1,
      Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1
    );

    // 2. Fetch all stops of the trip, including the city's cost_index
    const stopsRes = await db.query(
      `SELECT s.id, to_char(s.arrival_date, 'YYYY-MM-DD') as arrival_date, to_char(s.departure_date, 'YYYY-MM-DD') as departure_date, c.cost_index
       FROM stops s
       JOIN cities c ON s.city_id = c.id
       WHERE s.trip_id = $1`,
      [tripId]
    );

    // 3. Compute stays and meals costs dynamically based on city cost index
    // Cost levels mapping (1=Low, 2=Medium, 3=High)
    // Stay rates per night: Low = $50, Med = $120, High = $250
    // Meal rates per day: Low = $15, Med = $35, High = $75
    let stayCost = 0;
    let mealCost = 0;
    let transportCost = 0;

    stopsRes.rows.forEach((stop) => {
      const costIndex = stop.cost_index || 2;
      let stayRate = 120;
      let mealRate = 35;

      if (costIndex === 1) {
        stayRate = 50;
        mealRate = 15;
      } else if (costIndex === 3) {
        stayRate = 250;
        mealRate = 75;
      }

      // Compute number of nights spent at this stop
      let nights = 0;
      if (stop.arrival_date && stop.departure_date) {
        nights = Math.max(1, Math.ceil((new Date(stop.departure_date) - new Date(stop.arrival_date)) / (1000 * 60 * 60 * 24)));
      }

      stayCost += nights * stayRate;
      mealCost += (nights || 1) * mealRate;
    });

    // Transport cost: $100 per city transfer
    const stopsCount = stopsRes.rows.length;
    if (stopsCount > 1) {
      transportCost = (stopsCount - 1) * 100;
    }

    // Check if the user has manually saved estimated costs in the budgets table
    const budgetRes = await db.query(
      'SELECT transport_cost, stay_cost, activities_cost, meals_cost FROM budgets WHERE trip_id = $1',
      [tripId]
    );
    if (budgetRes.rows.length > 0) {
      transportCost = parseFloat(budgetRes.rows[0].transport_cost) || transportCost;
      stayCost = parseFloat(budgetRes.rows[0].stay_cost) || stayCost;
      mealCost = parseFloat(budgetRes.rows[0].meals_cost) || mealCost;
    }

    // 4. Fetch activity costs
    // Sum from selected trip activities
    let activityCost = 0;
    const stopIds = stopsRes.rows.map(s => s.id);
    if (stopIds.length > 0) {
      const actRes = await db.query(
        "SELECT COALESCE(SUM(cost), 0) as total_activities FROM trip_activities WHERE stop_id = ANY($1)",
        [stopIds]
      );
      activityCost = parseFloat(actRes.rows[0].total_activities) || 0;
    }

    // 5. Calculate totals
    const totalCost = stayCost + mealCost + transportCost + activityCost;
    const dailyAverage = parseFloat((totalCost / durationDays).toFixed(2)) || 0;

    // 6. Identify over-budget days (where daily stay + meals + activities cost exceeds $200)
    const overBudgetDays = [];
    // Fetch activities cost grouped by day_number
    let dailyActivities = {};
    if (stopIds.length > 0) {
      const dailyActRes = await db.query(
        "SELECT day_number, SUM(cost) as cost FROM trip_activities WHERE stop_id = ANY($1) GROUP BY day_number",
        [stopIds]
      );
      dailyActRes.rows.forEach(row => {
        dailyActivities[row.day_number] = parseFloat(row.cost) || 0;
      });
    }

    // Map each day number of the trip to its cost
    for (let day = 1; day <= durationDays; day++) {
      // Find which stop covers this day
      const dayDate = new Date(new Date(start_date).getTime() + (day - 1) * 24 * 60 * 60 * 1000);
      const activeStop = stopsRes.rows.find(stop => {
        if (!stop.arrival_date || !stop.departure_date) return false;
        const arr = new Date(stop.arrival_date);
        const dep = new Date(stop.departure_date);
        return dayDate >= arr && dayDate <= dep;
      });

      const costIndex = activeStop ? activeStop.cost_index : 2;
      let stayRate = 120;
      let mealRate = 35;
      if (costIndex === 1) {
        stayRate = 50;
        mealRate = 15;
      } else if (costIndex === 3) {
        stayRate = 250;
        mealRate = 75;
      }

      const actCost = dailyActivities[day] || 0;
      const dailyTotal = stayRate + mealRate + actCost;

      // Mark as overbudget if daily cost exceeds threshold (e.g. $200 limit)
      if (dailyTotal > 200) {
        overBudgetDays.push(day);
      }
    }

    // 7. Save calculations in budgets table for caching
    await db.query(
      `INSERT INTO budgets(trip_id, transport_cost, stay_cost, activities_cost, meals_cost, currency)
       VALUES($1, $2, $3, $4, $5, 'USD')
       ON CONFLICT (trip_id) DO UPDATE 
       SET transport_cost = EXCLUDED.transport_cost,
           stay_cost = EXCLUDED.stay_cost,
           activities_cost = EXCLUDED.activities_cost,
           meals_cost = EXCLUDED.meals_cost`,
      [tripId, transportCost, stayCost, activityCost, mealCost]
    );

    res.status(200).json({
      success: true,
      data: {
        totalCost,
        byCategory: {
          transport: transportCost,
          stay: stayCost,
          activities: activityCost,
          meals: mealCost
        },
        dailyAverage,
        overBudgetDays
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/budget/:tripId
 * @desc    Upsert estimated transport, stay, and meal costs for a trip
 * @access  Private (Person C)
 */
router.post('/:tripId', async (req, res, next) => {
  const { tripId } = req.params;
  const { transport_cost = 0, stay_cost = 0, meal_cost = 0 } = req.body;

  try {
    // Check if trip exists and belongs to the authenticated user
    const tripCheck = await db.query(
      'SELECT id FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Trip not found or unauthorized.' });
    }

    // Perform PostgreSQL Upsert using Person A's column names
    await db.query(
      `INSERT INTO budgets (trip_id, transport_cost, stay_cost, meals_cost)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (trip_id) 
       DO UPDATE SET 
         transport_cost = EXCLUDED.transport_cost,
         stay_cost = EXCLUDED.stay_cost,
         meals_cost = EXCLUDED.meals_cost`,
      [tripId, transport_cost, stay_cost, meal_cost]
    );

    res.status(200).json({
      success: true,
      message: 'Budget parameters saved successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

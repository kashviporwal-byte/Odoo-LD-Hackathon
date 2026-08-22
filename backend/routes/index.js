const express = require('express');
const router = express.Router();

// Import sub-routers
const authRouter = require('./auth');
const usersRouter = require('./users');
const tripsRouter = require('./trips');
const citiesRouter = require('./cities');
const activitiesRouter = require('./activities');
const budgetRouter = require('./budget');
const sharingRouter = require('./sharing');
const adminRouter = require('./admin');

// Mount sub-routers
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/trips', tripsRouter);
router.use('/cities', citiesRouter);
router.use('/activities', activitiesRouter);
router.use('/stops', activitiesRouter);
router.use('/budget', budgetRouter);
router.use('/sharing', sharingRouter);
router.use('/admin', adminRouter);

module.exports = router;

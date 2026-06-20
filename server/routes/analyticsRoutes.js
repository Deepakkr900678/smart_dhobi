const express = require('express');
const router = express.Router();
const {getAdminAnalytics, getAdminAnalytics} = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get('/provider', authMiddleware, getProviderAnalytics);
router.get('/admin', adminMiddleware, getAdminAnalytics);

module.exports = router;

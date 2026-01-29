const express = require('express');
const router = express.Router();
const { getDashboardStats, getChartData } = require('../controllers/statsController');

router.get('/kpi', getDashboardStats);
router.get('/charts', getChartData);

module.exports = router;
